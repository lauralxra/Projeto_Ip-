import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  AcaoAuditoria,
  Prisma,
  Role,
  StatusRegistro,
  TipoNotificacao,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import { ListNotificacaoDto } from './dto/list-notificacao.dto';
import type { AuthenticatedUser } from '../auth/interface/request.interface';

export interface DestinatarioAvisoSeguranca {
  email: string;
  nome: string;
}

interface Emissao {
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  nucleoId: string | null;
  // null = criada pelo agendador (RF27)
  criadorId: string | null;
  ip: string | null;
  destinatarios: string[];
  // Contexto extra gravado na auditoria
  contexto: Prisma.InputJsonObject;
}

export interface ResumoLembreteTrimestral {
  enviados: number;
  ignorados: number;
  falhas: number;
}

// Janela usada para não repetir o lembrete do mesmo núcleo (reinício do processo
// ou mais de uma instância da API disparando o mesmo cron)
const JANELA_LEMBRETE_DUPLICADO_MS = 12 * 60 * 60 * 1000;
const MAX_TAMANHO_ERRO_EMAIL = 500;

const SELECT_NOTIFICACAO = {
  id: true,
  titulo: true,
  mensagem: true,
  tipo: true,
  linkDestino: true,
  nucleoId: true,
  createdAt: true,
} satisfies Prisma.NotificacaoSelect;

function mensagemDeErro(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class NotificacaoService {
  private readonly logger = new Logger(NotificacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  // Aviso de segurança por e-mail. Não lança erro: a senha já foi trocada e uma falha
  // no SMTP não pode fazer o usuário achar que a alteração não aconteceu.
  async notificarSenhaAlterada(
    destinatario: DestinatarioAvisoSeguranca,
  ): Promise<boolean> {
    try {
      await this.mail.sendPasswordChanged(destinatario);
      return true;
    } catch (error) {
      this.logger.warn(
        `Senha alterada, mas o aviso por e-mail não foi enviado: ${mensagemDeErro(error)}`,
      );
      return false;
    }
  }

  async create(dto: CreateNotificacaoDto, autorId: string, ip: string) {
    if (dto.nucleoId) {
      await this.garantirNucleoAtivo(dto.nucleoId);
    }

    const destinatarios = await this.resolverDestinatarios(dto);

    if (destinatarios.length === 0) {
      throw new BadRequestException(
        'Nenhum usuário ativo atende aos critérios de destino informados.',
      );
    }

    const notificacaoId = await this.emitir({
      titulo: dto.titulo,
      mensagem: dto.mensagem,
      tipo: dto.tipo,
      nucleoId: dto.nucleoId ?? null,
      criadorId: autorId,
      ip,
      destinatarios,
      contexto: {
        origem: 'manual',
        perfilAlvo:
          dto.perfilAlvo ?? (dto.nucleoId ? Role.DIRETORES_NUCLEOS : null),
        todos: dto.todos ?? false,
      },
    });

    return {
      message: 'Notificação registrada. O envio dos e-mails está em andamento.',
      id: notificacaoId,
      totalDestinatarios: destinatarios.length,
    };
  }

  // RN01: a notificação vai só para o público-alvo escolhido. Com núcleo e sem perfil,
  // vai apenas aos diretores do núcleo.
  private async resolverDestinatarios(
    dto: CreateNotificacaoDto,
  ): Promise<string[]> {
    const ids = dto.destinatarioIds;
    const temFiltro = Boolean(dto.nucleoId || dto.perfilAlvo || ids?.length);

    if (!temFiltro && !dto.todos) {
      throw new BadRequestException(
        'Informe o destino (nucleoId, perfilAlvo ou destinatarioIds) ou confirme o envio geral com "todos": true.',
      );
    }

    if (temFiltro && dto.todos) {
      throw new BadRequestException(
        '"todos" não pode ser combinado com nucleoId, perfilAlvo ou destinatarioIds.',
      );
    }

    const where: Prisma.UserWhereInput = { ativo: true, deletedAt: null };

    if (ids?.length) {
      where.id = { in: ids };
    }

    if (dto.nucleoId) {
      where.nucleos = { some: { nucleoId: dto.nucleoId } };
      where.perfil = dto.perfilAlvo ?? Role.DIRETORES_NUCLEOS;
    } else if (dto.perfilAlvo) {
      where.perfil = dto.perfilAlvo;
    }

    const usuarios = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (ids?.length && usuarios.length !== ids.length) {
      throw new BadRequestException(
        `${ids.length - usuarios.length} destinatário(s) não existe(m), está(ão) inativo(s) ou fora do núcleo/perfil informado.`,
      );
    }

    return usuarios.map((u) => u.id);
  }

  private async garantirNucleoAtivo(nucleoId: string) {
    const nucleo = await this.prisma.nucleo.findFirst({
      where: { id: nucleoId, deletedAt: null },
      select: { status: true },
    });

    if (!nucleo) {
      throw new NotFoundException('Núcleo não encontrado.');
    }

    if (nucleo.status !== StatusRegistro.ATIVO) {
      throw new BadRequestException(
        'Não é possível notificar um núcleo inativo.',
      );
    }
  }

  // Notificação, destinatários e auditoria são gravados juntos; os e-mails saem depois,
  // fora da requisição, e o resultado de cada um fica em notificacao_usuarios.
  private async emitir(emissao: Emissao): Promise<string> {
    const notificacao = await this.prisma.$transaction(async (tx) => {
      const criada = await tx.notificacao.create({
        data: {
          titulo: emissao.titulo,
          mensagem: emissao.mensagem,
          tipo: emissao.tipo,
          nucleoId: emissao.nucleoId,
          criadorId: emissao.criadorId,
          destinatarios: {
            create: emissao.destinatarios.map((userId) => ({ userId })),
          },
        },
        select: { id: true },
      });

      await this.audit.registrarAcao(
        {
          userId: emissao.criadorId,
          acao: AcaoAuditoria.CRIAR,
          entidade: 'Notificacao',
          entidadeId: criada.id,
          dadosNovos: {
            ...emissao.contexto,
            titulo: emissao.titulo,
            tipo: emissao.tipo,
            nucleoId: emissao.nucleoId,
            totalDestinatarios: emissao.destinatarios.length,
          },
          ip: emissao.ip,
        },
        tx,
      );

      return criada;
    });

    // Sem await: a resposta não espera o SMTP. O catch impede rejeição não tratada,
    // que derrubaria o processo.
    this.enviarEmails(notificacao.id, emissao).catch((error) =>
      this.logger.error(
        `Falha no envio dos e-mails da notificação ${notificacao.id}: ${mensagemDeErro(error)}`,
      ),
    );

    return notificacao.id;
  }

  private async enviarEmails(notificacaoId: string, emissao: Emissao) {
    const usuarios = await this.prisma.user.findMany({
      where: {
        id: { in: emissao.destinatarios },
        ativo: true,
        deletedAt: null,
      },
      select: { id: true, email: true },
    });

    let enviados = 0;

    for (const usuario of usuarios) {
      const chave = {
        notificacaoId_userId: { notificacaoId, userId: usuario.id },
      };

      try {
        await this.mail.sendNotificacao(
          usuario.email,
          emissao.titulo,
          emissao.mensagem,
        );
        enviados++;
        await this.prisma.notificacaoUsuario.update({
          where: chave,
          data: { emailEnviadoEm: new Date(), emailErro: null },
        });
      } catch (error) {
        // Loga o id, não o e-mail (dado pessoal)
        this.logger.warn(
          `E-mail da notificação ${notificacaoId} não enviado ao usuário ${usuario.id}: ${mensagemDeErro(error)}`,
        );
        await this.prisma.notificacaoUsuario
          .update({
            where: chave,
            data: {
              emailErro: mensagemDeErro(error).slice(0, MAX_TAMANHO_ERRO_EMAIL),
            },
          })
          .catch(() => undefined);
      }
    }

    this.logger.log(
      `Notificação ${notificacaoId}: ${enviados}/${usuarios.length} e-mail(s) enviado(s).`,
    );
  }

  // Início de cada trimestre (jan, abr, jul, out), às 8h no horário de Recife.
  // RN01: o lembrete vai só aos diretores de cada núcleo ativo.
  @Cron('0 8 1 1,4,7,10 *', {
    name: 'lembrete-trimestral',
    timeZone: 'America/Recife',
  })
  async enviarLembreteTrimestral(): Promise<ResumoLembreteTrimestral> {
    this.logger.log('[CRON] Enviando lembretes trimestrais...');
    const resumo: ResumoLembreteTrimestral = {
      enviados: 0,
      ignorados: 0,
      falhas: 0,
    };

    const nucleos = await this.prisma.nucleo.findMany({
      where: { status: StatusRegistro.ATIVO, deletedAt: null },
      select: { id: true, nome: true },
    });

    for (const nucleo of nucleos) {
      // Um núcleo com problema não impede o lembrete dos demais
      try {
        const jaEnviado = await this.prisma.notificacao.findFirst({
          where: {
            tipo: TipoNotificacao.PRAZO_PREENCHIMENTO,
            nucleoId: nucleo.id,
            criadorId: null,
            createdAt: {
              gte: new Date(Date.now() - JANELA_LEMBRETE_DUPLICADO_MS),
            },
          },
          select: { id: true },
        });

        if (jaEnviado) {
          resumo.ignorados++;
          continue;
        }

        const diretores = await this.prisma.user.findMany({
          where: {
            ativo: true,
            deletedAt: null,
            perfil: Role.DIRETORES_NUCLEOS,
            nucleos: { some: { nucleoId: nucleo.id } },
          },
          select: { id: true },
        });

        if (diretores.length === 0) {
          this.logger.warn(
            `[CRON] Núcleo ${nucleo.id} sem diretores ativos; lembrete não enviado.`,
          );
          resumo.ignorados++;
          continue;
        }

        await this.emitir({
          titulo: 'Lembrete de preenchimento trimestral',
          mensagem: `O período de preenchimento de indicadores do núcleo ${nucleo.nome} está aberto.`,
          tipo: TipoNotificacao.PRAZO_PREENCHIMENTO,
          nucleoId: nucleo.id,
          criadorId: null,
          ip: null,
          destinatarios: diretores.map((d) => d.id),
          contexto: {
            origem: 'agendador',
            perfilAlvo: Role.DIRETORES_NUCLEOS,
          },
        });
        resumo.enviados++;
      } catch (error) {
        resumo.falhas++;
        this.logger.error(
          `[CRON] Falha no lembrete do núcleo ${nucleo.id}: ${mensagemDeErro(error)}`,
        );
      }
    }

    this.logger.log(
      `[CRON] Lembretes trimestrais: ${resumo.enviados} enviado(s), ${resumo.ignorados} ignorado(s), ${resumo.falhas} falha(s).`,
    );
    return resumo;
  }

  async findByUsuario(userId: string, { pagina, limite }: ListNotificacaoDto) {
    const where: Prisma.NotificacaoUsuarioWhereInput = { userId };

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.notificacaoUsuario.findMany({
        where,
        select: {
          isRead: true,
          readAt: true,
          notificacao: { select: SELECT_NOTIFICACAO },
        },
        orderBy: { notificacao: { createdAt: 'desc' } },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.notificacaoUsuario.count({ where }),
    ]);

    return { itens, total, pagina, limite };
  }

  async marcarComoLida(notificacaoId: string, userId: string) {
    const chave = { notificacaoId_userId: { notificacaoId, userId } };

    // Busca pela chave (notificação + usuário logado): ninguém marca a notificação de outro
    const registro = await this.prisma.notificacaoUsuario.findUnique({
      where: chave,
      select: { isRead: true },
    });

    if (!registro) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    if (registro.isRead) {
      return { message: 'Notificação já estava marcada como lida.' };
    }

    await this.prisma.notificacaoUsuario.update({
      where: chave,
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'Notificação marcada como lida.' };
  }

  async marcarTodasComoLidas(userId: string) {
    const { count } = await this.prisma.notificacaoUsuario.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: `${count} notificação(ões) marcada(s) como lida(s).` };
  }

  async findAll({ pagina, limite }: ListNotificacaoDto) {
    const [itens, total] = await this.prisma.$transaction([
      this.prisma.notificacao.findMany({
        select: {
          ...SELECT_NOTIFICACAO,
          criadorId: true,
          _count: { select: { destinatarios: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.notificacao.count(),
    ]);

    return { itens, total, pagina, limite };
  }

  // UC014: remove a notificação da caixa do usuário autenticado.
  // Se a notificação existir mas não estiver na caixa do usuário, responde 403
  // para todos os perfis, inclusive o administrador: a exclusão global só
  // acontece pela rota explícita DELETE /notificacoes/admin/:id. Assim, um
  // clique repetido ou uma lista desatualizada na aba Recebidas nunca apaga a
  // notificação dos outros destinatários.
  async excluir(notificacaoId: string, usuario: AuthenticatedUser, ip: string) {
    const notificacao = await this.prisma.notificacao.findUnique({
      where: { id: notificacaoId },
      select: { id: true, titulo: true, tipo: true, nucleoId: true },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    const chave = {
      notificacaoId_userId: { notificacaoId, userId: usuario.id },
    };
    const vinculo = await this.prisma.notificacaoUsuario.findUnique({
      where: chave,
      select: { isRead: true },
    });

    if (!vinculo) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta notificação.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.notificacaoUsuario.deleteMany({
        where: { notificacaoId, userId: usuario.id },
      });

      if (count === 0) {
        throw new NotFoundException('Notificação não encontrada.');
      }

      await this.audit.registrarAcao(
        {
          userId: usuario.id,
          acao: AcaoAuditoria.EXCLUIR_LOGICO,
          entidade: 'Notificacao',
          entidadeId: notificacaoId,
          dadosAntigos: {
            titulo: notificacao.titulo,
            tipo: notificacao.tipo,
            isRead: vinculo.isRead,
            escopo: 'usuario',
          },
          dadosNovos: { excluidaParaUsuario: true },
          ip,
        },
        tx,
      );
    });

    return { message: 'Notificação excluída com sucesso.' };
  }

  // UC014 (Administração): remove a notificação definitivamente para todos os destinatários
  async excluirComoAdmin(notificacaoId: string, adminId: string, ip: string) {
    const notificacao = await this.prisma.notificacao.findUnique({
      where: { id: notificacaoId },
      select: {
        id: true,
        titulo: true,
        tipo: true,
        nucleoId: true,
        _count: { select: { destinatarios: true } },
      },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.notificacao.deleteMany({
        where: { id: notificacaoId },
      });

      if (count === 0) {
        throw new NotFoundException('Notificação não encontrada.');
      }

      await this.audit.registrarAcao(
        {
          userId: adminId,
          acao: AcaoAuditoria.EXCLUIR_LOGICO,
          entidade: 'Notificacao',
          entidadeId: notificacaoId,
          dadosAntigos: {
            titulo: notificacao.titulo,
            tipo: notificacao.tipo,
            nucleoId: notificacao.nucleoId,
            totalDestinatarios: notificacao._count.destinatarios,
            escopo: 'global',
          },
          dadosNovos: { excluida: true },
          ip,
        },
        tx,
      );
    });

    return { message: 'Notificação excluída com sucesso.' };
  }
}
