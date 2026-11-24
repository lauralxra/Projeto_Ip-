import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcaoAuditoria, Prisma, Role, StatusRegistro } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';
import { AuthenticatedUser } from '../auth/interface/request.interface';
import { CreateProgramaDto } from './dto/create-programa.dto';
import { UpdateProgramaDto } from './dto/update-programa.dto';
import { FilterProgramaDto } from './dto/filter-programa.dto';

// Mesmo critério dos núcleos (RN02): Administrador e Comunicação veem todos os programas;
// Diretor de Núcleo e Equipe de Gestão, os dos seus núcleos e os institucionais (sem núcleo)
const PERFIS_ACESSO_GLOBAL: Role[] = [
  Role.ADMINISTRADOR,
  Role.EQUIPE_COMUNICACAO,
];

const ehSiglaInstitucional = (sigla?: string | null) => {
  const normalizada = (sigla ?? '').trim().toUpperCase();
  return normalizada === 'IPÊ' || normalizada === 'IPE';
};

const SELECT_PROGRAMA = {
  id: true,
  nome: true,
  descricao: true,
  status: true,
  nucleoId: true,
  nucleo: { select: { id: true, nome: true, sigla: true } },
  dataInicio: true,
  responsavelId: true,
  responsavel: { select: { id: true, nome: true } },
  participantes: {
    // Usuários excluídos não aparecem como participantes
    where: { user: { deletedAt: null } },
    select: { user: { select: { id: true, nome: true } } },
    orderBy: { createdAt: 'asc' },
  },
  _count: {
    select: {
      indicadores: { where: { deletedAt: null } },
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProgramaSelect;

// Data só com dia (coluna DATE): AAAA-MM-DD <-> Date em UTC
const paraData = (texto: string) => new Date(`${texto}T00:00:00.000Z`);
const daData = (data: Date | null) =>
  data ? data.toISOString().slice(0, 10) : null;

const mesmosIds = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

type MudancaStatus = {
  status: StatusRegistro;
  acao: AcaoAuditoria;
  mensagem: string;
};

const DESATIVAR: MudancaStatus = {
  status: StatusRegistro.INATIVO,
  acao: AcaoAuditoria.DESATIVAR,
  mensagem: 'Programa desativado com sucesso.',
};
const ARQUIVAR: MudancaStatus = {
  status: StatusRegistro.ARQUIVADO,
  acao: AcaoAuditoria.ARQUIVAR,
  mensagem: 'Programa arquivado com sucesso.',
};
const REATIVAR: MudancaStatus = {
  status: StatusRegistro.ATIVO,
  acao: AcaoAuditoria.RESTAURAR,
  mensagem: 'Programa reativado com sucesso.',
};

@Injectable()
export class ProgramaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateProgramaDto, autor: AutorAcao) {
    const nucleoId = dto.nucleoId ?? null;
    const responsavelId = dto.responsavelId ?? null;
    const participanteIds = dto.participanteIds ?? [];

    const nucleo = nucleoId ? await this.garantirNucleoAtivo(nucleoId) : null;
    await this.garantirUsuariosAtivos([
      ...(responsavelId ? [responsavelId] : []),
      ...participanteIds,
    ]);
    if (responsavelId) {
      await this.garantirResponsavelDoNucleo(
        responsavelId,
        nucleoId,
        nucleo?.sigla,
      );
    }
    await this.garantirNomeDisponivel(dto.nome, nucleoId);

    const programa = await this.prisma.programa.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao || null,
        nucleoId,
        responsavelId,
        dataInicio: dto.dataInicio ? paraData(dto.dataInicio) : null,
        participantes: {
          create: participanteIds.map((userId) => ({ userId })),
        },
      },
      select: SELECT_PROGRAMA,
    });

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.CRIAR,
      entidade: 'Programa',
      entidadeId: programa.id,
      dadosNovos: {
        nome: programa.nome,
        descricao: programa.descricao,
        nucleoId: programa.nucleoId,
        responsavelId: programa.responsavelId,
        dataInicio: daData(programa.dataInicio),
        participanteIds,
        status: programa.status,
      },
      ip: autor.ip,
    });

    return programa;
  }

  // Devolve uma lista (não paginada): os programas são poucos e a lista alimenta
  // filtros de outras telas, que esperam um array
  async findAll(filtros: FilterProgramaDto, usuario: AuthenticatedUser) {
    const status = filtros.status ?? StatusRegistro.ATIVO;

    // Programas inativos e arquivados só interessam à gestão do cadastro
    if (
      status !== StatusRegistro.ATIVO &&
      usuario.role !== Role.ADMINISTRADOR
    ) {
      throw new ForbiddenException(
        'Somente o administrador pode consultar programas inativos ou arquivados.',
      );
    }

    const where: Prisma.ProgramaWhereInput = {
      deletedAt: null,
      status,
      ...this.escopoDoUsuario(usuario),
    };

    if (filtros.nome) {
      where.nome = { contains: filtros.nome, mode: 'insensitive' };
    }
    if (filtros.nucleoId) {
      where.nucleoId = filtros.nucleoId;
    }

    return this.prisma.programa.findMany({
      where,
      select: SELECT_PROGRAMA,
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, usuario: AuthenticatedUser) {
    const programa = await this.prisma.programa.findFirst({
      where: {
        id,
        deletedAt: null,
        // Fora do escopo ou não ativo responde 404, sem revelar que o programa existe
        ...(usuario.role !== Role.ADMINISTRADOR && {
          status: StatusRegistro.ATIVO,
        }),
        ...this.escopoDoUsuario(usuario),
      },
      select: {
        ...SELECT_PROGRAMA,
        acoes: {
          where: { deletedAt: null },
          select: { id: true, nome: true, status: true },
          orderBy: { nome: 'asc' },
        },
      },
    });

    if (!programa) {
      throw new NotFoundException('Programa não encontrado.');
    }

    return programa;
  }

  async update(id: string, dto: UpdateProgramaDto, autor: AutorAcao) {
    const atual = await this.buscarNaoExcluido(id);

    const nome = dto.nome ?? atual.nome;
    const nucleoId = dto.nucleoId === undefined ? atual.nucleoId : dto.nucleoId;
    const descricao =
      dto.descricao === undefined ? atual.descricao : dto.descricao || null;
    const responsavelId =
      dto.responsavelId === undefined ? atual.responsavelId : dto.responsavelId;
    const dataInicioAtual = daData(atual.dataInicio);
    const dataInicio =
      dto.dataInicio === undefined ? dataInicioAtual : dto.dataInicio;
    const participantesAtuais = atual.participantes.map((p) => p.userId);
    // undefined ou null mantém a lista; [] remove todos
    const participanteIds = dto.participanteIds ?? participantesAtuais;

    const mudancas: Record<string, { de: unknown; para: unknown }> = {};
    if (nome !== atual.nome) mudancas.nome = { de: atual.nome, para: nome };
    if (descricao !== atual.descricao) {
      mudancas.descricao = { de: atual.descricao, para: descricao };
    }
    if (nucleoId !== atual.nucleoId) {
      mudancas.nucleoId = { de: atual.nucleoId, para: nucleoId };
    }
    if (responsavelId !== atual.responsavelId) {
      mudancas.responsavelId = { de: atual.responsavelId, para: responsavelId };
    }
    if (dataInicio !== dataInicioAtual) {
      mudancas.dataInicio = { de: dataInicioAtual, para: dataInicio };
    }
    if (!mesmosIds(participanteIds, participantesAtuais)) {
      mudancas.participanteIds = {
        de: participantesAtuais,
        para: participanteIds,
      };
    }

    if (Object.keys(mudancas).length === 0) {
      throw new BadRequestException('Nenhuma alteração informada.');
    }

    let nucleoSigla: string | null | undefined;
    if (mudancas.nucleoId && nucleoId) {
      const nucleo = await this.garantirNucleoAtivo(nucleoId);
      nucleoSigla = nucleo.sigla;
    }
    if (mudancas.nome || mudancas.nucleoId) {
      await this.garantirNomeDisponivel(nome, nucleoId, id);
    }
    // Só valida os usuários que estão entrando no programa
    await this.garantirUsuariosAtivos([
      ...(mudancas.responsavelId && responsavelId ? [responsavelId] : []),
      ...participanteIds.filter((u) => !participantesAtuais.includes(u)),
    ]);
    if ((mudancas.responsavelId || mudancas.nucleoId) && responsavelId) {
      if (nucleoId && nucleoSigla === undefined) {
        const nucleoAtual = await this.prisma.nucleo.findFirst({
          where: { id: nucleoId, deletedAt: null },
          select: { sigla: true },
        });
        nucleoSigla = nucleoAtual?.sigla ?? null;
      }
      await this.garantirResponsavelDoNucleo(
        responsavelId,
        nucleoId,
        nucleoSigla,
      );
    }

    // Programa e participantes mudam juntos
    const atualizado = await this.prisma.$transaction(async (tx) => {
      if (mudancas.participanteIds) {
        await tx.programaParticipante.deleteMany({ where: { programaId: id } });
        await tx.programaParticipante.createMany({
          data: participanteIds.map((userId) => ({ programaId: id, userId })),
        });
      }
      return tx.programa.update({
        where: { id },
        data: {
          nome,
          descricao,
          nucleoId,
          responsavelId,
          dataInicio: dataInicio ? paraData(dataInicio) : null,
        },
        select: SELECT_PROGRAMA,
      });
    });

    const lado = (chave: 'de' | 'para') =>
      Object.fromEntries(
        Object.entries(mudancas).map(([campo, valor]) => [campo, valor[chave]]),
      ) as Prisma.InputJsonObject;

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Programa',
      entidadeId: id,
      dadosAntigos: lado('de'),
      dadosNovos: lado('para'),
      ip: autor.ip,
    });

    return atualizado;
  }

  desativar(id: string, autor: AutorAcao) {
    return this.alterarStatus(id, DESATIVAR, autor);
  }

  arquivar(id: string, autor: AutorAcao) {
    return this.alterarStatus(id, ARQUIVAR, autor);
  }

  reativar(id: string, autor: AutorAcao) {
    return this.alterarStatus(id, REATIVAR, autor);
  }

  // Exclusão lógica (RN07). Programas com indicadores ou ações vigentes não podem
  // ser excluídos: os vínculos ficariam apontando para um programa excluído
  async remove(id: string, autor: AutorAcao) {
    const programa = await this.prisma.programa.findFirst({
      where: { id, deletedAt: null },
      select: {
        nome: true,
        status: true,
        nucleoId: true,
        _count: {
          select: {
            indicadores: { where: { deletedAt: null } },
            acoes: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!programa) {
      throw new NotFoundException('Programa não encontrado.');
    }

    const { _count: vinculos, ...dados } = programa;
    const impeditivos = [
      vinculos.indicadores > 0 && 'indicadores',
      vinculos.acoes > 0 && 'ações',
    ].filter(Boolean);
    if (impeditivos.length > 0) {
      throw new ConflictException(
        `O programa não pode ser excluído pois possui ${impeditivos.join(' e ')} vinculados. Desative ou arquive o programa.`,
      );
    }

    // O filtro em deletedAt evita excluir duas vezes em requisições concorrentes
    const { count } = await this.prisma.programa.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count === 0) {
      throw new NotFoundException('Programa não encontrado.');
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.EXCLUIR_LOGICO,
      entidade: 'Programa',
      entidadeId: id,
      dadosAntigos: dados,
      dadosNovos: { excluido: true },
      ip: autor.ip,
    });
  }

  contarAtivos() {
    return this.prisma.programa.count({
      where: { status: StatusRegistro.ATIVO, deletedAt: null },
    });
  }

  contarPorNucleo() {
    return this.prisma.programa.groupBy({
      by: ['nucleoId'],
      where: { status: StatusRegistro.ATIVO, deletedAt: null },
      _count: { id: true },
    });
  }

  private escopoDoUsuario(
    usuario: AuthenticatedUser,
  ): Prisma.ProgramaWhereInput {
    if (PERFIS_ACESSO_GLOBAL.includes(usuario.role)) return {};

    return {
      OR: [
        { nucleoId: null },
        { nucleo: { users: { some: { userId: usuario.id } } } },
      ],
    };
  }

  private async alterarStatus(
    id: string,
    mudanca: MudancaStatus,
    autor: AutorAcao,
  ) {
    const atual = await this.buscarNaoExcluido(id);

    if (atual.status === mudanca.status) {
      throw new ConflictException(
        `O programa já está ${mudanca.status.toLowerCase()}.`,
      );
    }

    // UC031: arquivar só muda o status. O vínculo dos indicadores é mantido para
    // preservar o histórico (filtro por programa no Dashboard) e permitir que a
    // reativação volte ao estado anterior; programas não ATIVOS já são recusados
    // em novos vínculos de indicadores e na importação.
    // Só altera se o status ainda for o lido acima: evita auditar duas vezes
    // em requisições concorrentes
    const { count } = await this.prisma.programa.updateMany({
      where: { id, deletedAt: null, status: atual.status },
      data: { status: mudanca.status },
    });
    if (count === 0) {
      throw new ConflictException(
        'O programa foi alterado por outra operação. Tente novamente.',
      );
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: mudanca.acao,
      entidade: 'Programa',
      entidadeId: id,
      dadosAntigos: { status: atual.status },
      dadosNovos: { status: mudanca.status },
      ip: autor.ip,
    });

    return { message: mudanca.mensagem };
  }

  private async buscarNaoExcluido(id: string) {
    const programa = await this.prisma.programa.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        nome: true,
        descricao: true,
        status: true,
        nucleoId: true,
        responsavelId: true,
        dataInicio: true,
        participantes: { select: { userId: true } },
      },
    });

    if (!programa) {
      throw new NotFoundException('Programa não encontrado.');
    }

    return programa;
  }

  // Responsável e participantes precisam ser usuários ativos e não excluídos
  private async garantirUsuariosAtivos(ids: string[]) {
    const unicos = [...new Set(ids)];
    if (unicos.length === 0) return;

    const encontrados = await this.prisma.user.count({
      where: { id: { in: unicos }, ativo: true, deletedAt: null },
    });

    if (encontrados !== unicos.length) {
      throw new BadRequestException(
        'Responsável ou participante não existe ou está inativo.',
      );
    }
  }

  // UC27: o responsável pelo programa deve pertencer ao núcleo selecionado
  // (ou possuir perfil institucional/vínculo com IPÊ em programas institucionais)
  private async garantirResponsavelDoNucleo(
    responsavelId: string,
    nucleoId: string | null,
    nucleoSigla?: string | null,
  ) {
    const usuario = await this.prisma.user.findFirst({
      where: { id: responsavelId, ativo: true, deletedAt: null },
      select: {
        id: true,
        perfil: true,
        nucleos: { select: { nucleoId: true } },
      },
    });

    if (!usuario) {
      throw new BadRequestException(
        'Responsável ou participante não existe ou está inativo.',
      );
    }

    const vinculadoAoNucleo = Boolean(
      nucleoId && usuario.nucleos.some((v) => v.nucleoId === nucleoId),
    );
    const ehInstitucional = !nucleoId || ehSiglaInstitucional(nucleoSigla);
    const perfilInstitucional =
      usuario.perfil !== null && PERFIS_ACESSO_GLOBAL.includes(usuario.perfil);

    const elegivel = ehInstitucional
      ? vinculadoAoNucleo || perfilInstitucional
      : vinculadoAoNucleo;

    if (!elegivel) {
      throw new BadRequestException(
        'O responsável selecionado não está vinculado ao núcleo informado para o programa.',
      );
    }
  }

  private async garantirNucleoAtivo(nucleoId: string) {
    const nucleo = await this.prisma.nucleo.findFirst({
      where: { id: nucleoId, deletedAt: null },
      select: { status: true, sigla: true },
    });

    if (!nucleo) {
      throw new NotFoundException('Núcleo não encontrado.');
    }
    if (nucleo.status !== StatusRegistro.ATIVO) {
      throw new BadRequestException(
        'Não é possível vincular o programa a um núcleo inativo.',
      );
    }

    return nucleo;
  }

  // Espelha o índice único programas_nucleo_nome_ativo_key (nome sem diferenciar
  // maiúsculas, por núcleo, entre não excluídos) para dar uma mensagem clara
  private async garantirNomeDisponivel(
    nome: string,
    nucleoId: string | null,
    ignorarId?: string,
  ) {
    const conflito = await this.prisma.programa.findFirst({
      where: {
        deletedAt: null,
        nucleoId,
        nome: { equals: nome, mode: 'insensitive' },
        ...(ignorarId && { id: { not: ignorarId } }),
      },
      select: { id: true },
    });

    if (conflito) {
      throw new ConflictException(
        nucleoId
          ? 'Já existe um programa com este nome neste núcleo.'
          : 'Já existe um programa institucional com este nome.',
      );
    }
  }
}
