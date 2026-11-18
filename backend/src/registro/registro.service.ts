import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcaoAuditoria,
  Prisma,
  Role,
  StatusAprovacao,
  StatusRegistro,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';
import type { AuthenticatedUser } from '../auth/interface/request.interface';
import { UpdateRegistroDto } from './dto/update-registro.dto';

// RN01: só dado homologado chega à Comunicação
const STATUS_VISIVEIS_COMUNICACAO: StatusAprovacao[] = [
  StatusAprovacao.APROVADO,
  StatusAprovacao.PUBLICADO,
];

// RN02: o núcleo só edita enquanto o dado não foi enviado para revisão
const STATUS_EDITAVEIS_NUCLEO: StatusAprovacao[] = [
  StatusAprovacao.PENDENTE,
  StatusAprovacao.EM_PREENCHIMENTO,
  StatusAprovacao.NECESSITA_CORRECAO,
];

// RN04: mudar um valor já homologado devolve o dado para revisão
const STATUS_HOMOLOGADOS: StatusAprovacao[] = [
  StatusAprovacao.APROVADO,
  StatusAprovacao.PUBLICADO,
];

const valorParaAuditoria = (valor: Prisma.Decimal | null | undefined) =>
  valor === null || valor === undefined ? null : valor.toString();

const INCLUDE_INDICADOR = {
  indicador: {
    select: {
      id: true,
      nome: true,
      codigo: true,
      unidadeMedida: true,
      escopo: true,
      nucleoId: true,
      nucleo: { select: { id: true, nome: true, sigla: true } },
    },
  },
} satisfies Prisma.IndicadorRegistroInclude;

@Injectable()
export class RegistroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async nucleosDoUsuario(userId: string): Promise<string[]> {
    const vinculos = await this.prisma.userNucleo.findMany({
      where: { userId },
      select: { nucleoId: true },
    });
    return vinculos.map((v) => v.nucleoId);
  }

  // Filtro de visibilidade comum a findAll e findOne (RF04, RN01)
  private async filtroVisibilidade(
    usuario: AuthenticatedUser,
  ): Promise<Prisma.IndicadorRegistroWhereInput> {
    if (usuario.role === Role.ADMINISTRADOR) {
      return { deletedAt: null };
    }

    const base: Prisma.IndicadorRegistroWhereInput = {
      deletedAt: null,
      status: StatusRegistro.ATIVO,
    };

    if (usuario.role === Role.EQUIPE_COMUNICACAO) {
      return {
        ...base,
        statusAprovacao: { in: STATUS_VISIVEIS_COMUNICACAO },
        indicador: { deletedAt: null },
      };
    }

    const nucleos = await this.nucleosDoUsuario(usuario.id);
    return {
      ...base,
      indicador: { deletedAt: null, nucleoId: { in: nucleos } },
    };
  }

  async findAll(usuario: AuthenticatedUser) {
    return this.prisma.indicadorRegistro.findMany({
      where: await this.filtroVisibilidade(usuario),
      include: INCLUDE_INDICADOR,
      orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }],
    });
  }

  async findOne(id: string, usuario: AuthenticatedUser) {
    const filtro = await this.filtroVisibilidade(usuario);
    const registro = await this.prisma.indicadorRegistro.findFirst({
      where: { AND: [{ id }, filtro] },
      include: INCLUDE_INDICADOR,
    });

    // 404 também quando o registro existe mas está fora do alcance do usuário,
    // para não revelar a existência de dados de outros núcleos
    if (!registro) {
      throw new NotFoundException('Registro não encontrado.');
    }

    return registro;
  }

  // RF09: altera o valor realizado respeitando o fluxo de aprovação
  async update(
    id: string,
    dados: UpdateRegistroDto,
    usuario: AuthenticatedUser,
    ip?: string,
  ) {
    const existente = await this.prisma.indicadorRegistro.findFirst({
      where: { id, deletedAt: null },
      include: { indicador: { select: { nucleoId: true, deletedAt: true } } },
    });

    if (!existente || existente.indicador.deletedAt) {
      throw new NotFoundException('Registro não encontrado.');
    }

    if (existente.status === StatusRegistro.INATIVO) {
      throw new ConflictException(
        'Registros inativos não podem ser alterados.',
      );
    }

    const ehAdministrador = usuario.role === Role.ADMINISTRADOR;

    if (!ehAdministrador) {
      const nucleos = await this.nucleosDoUsuario(usuario.id);
      if (
        !existente.indicador.nucleoId ||
        !nucleos.includes(existente.indicador.nucleoId)
      ) {
        throw new ForbiddenException(
          'Você só pode alterar registros de indicadores do seu núcleo.',
        );
      }

      if (!STATUS_EDITAVEIS_NUCLEO.includes(existente.statusAprovacao)) {
        throw new ConflictException(
          'Este valor já foi enviado para revisão e não pode mais ser alterado pelo núcleo.',
        );
      }
    }

    const eraHomologado = STATUS_HOMOLOGADOS.includes(
      existente.statusAprovacao,
    );

    let novoStatus: StatusAprovacao;
    if (
      eraHomologado ||
      existente.statusAprovacao === StatusAprovacao.ENVIADO_REVISAO
    ) {
      novoStatus = StatusAprovacao.ENVIADO_REVISAO;
    } else {
      novoStatus = StatusAprovacao.EM_PREENCHIMENTO;
    }

    const atualizado = await this.prisma.indicadorRegistro.update({
      where: { id },
      data: {
        valorRealizado: dados.valorRealizado,
        responsavelId: usuario.id,
        statusAprovacao: novoStatus,
        // Um valor homologado que mudou perde a aprovação e a publicação anteriores
        ...(eraHomologado
          ? {
              aprovadorId: null,
              revisadoEm: null,
              publicadoPorId: null,
              publicadoEm: null,
            }
          : {}),
      },
      include: INCLUDE_INDICADOR,
    });

    await this.audit.registrarAcao({
      userId: usuario.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'IndicadorRegistro',
      entidadeId: id,
      dadosAntigos: {
        valorRealizado: valorParaAuditoria(existente.valorRealizado),
        statusAprovacao: existente.statusAprovacao,
      },
      dadosNovos: {
        valorRealizado: dados.valorRealizado,
        statusAprovacao: novoStatus,
      },
      ip,
    });

    return atualizado;
  }

  // Transição atômica de status: o updateMany só altera se o status ainda for
  // um dos esperados, evitando que duas revisões simultâneas se sobreponham
  private async transicionar(params: {
    id: string;
    de: StatusAprovacao[];
    para: StatusAprovacao;
    dados?: Prisma.IndicadorRegistroUncheckedUpdateManyInput;
    acao: AcaoAuditoria;
    userId: string;
    ip?: string;
    auditoriaExtra?: Record<string, unknown>;
    mensagemConflito: string;
  }) {
    const { id, de, para } = params;
    const anterior = await this.prisma.indicadorRegistro.findFirst({
      where: { id, deletedAt: null, status: StatusRegistro.ATIVO },
      select: { statusAprovacao: true },
    });

    if (!anterior) {
      throw new NotFoundException('Registro não encontrado ou inativo.');
    }

    const { count } = await this.prisma.indicadorRegistro.updateMany({
      where: {
        id,
        deletedAt: null,
        status: StatusRegistro.ATIVO,
        statusAprovacao: { in: de },
      },
      data: { ...params.dados, statusAprovacao: para },
    });

    if (count === 0) {
      throw new ConflictException(params.mensagemConflito);
    }

    await this.audit.registrarAcao({
      userId: params.userId,
      acao: params.acao,
      entidade: 'IndicadorRegistro',
      entidadeId: id,
      dadosAntigos: { statusAprovacao: anterior.statusAprovacao },
      dadosNovos: { statusAprovacao: para, ...params.auditoriaExtra },
      ip: params.ip,
    });

    return this.prisma.indicadorRegistro.findUniqueOrThrow({
      where: { id },
      include: INCLUDE_INDICADOR,
    });
  }

  // RF14: o núcleo envia o valor preenchido para a revisão da gestão
  async enviarParaRevisao(id: string, usuario: AuthenticatedUser, ip?: string) {
    const registro = await this.prisma.indicadorRegistro.findFirst({
      where: { id, deletedAt: null, status: StatusRegistro.ATIVO },
      select: {
        valorRealizado: true,
        indicador: { select: { nucleoId: true, deletedAt: true } },
      },
    });

    if (!registro || registro.indicador.deletedAt) {
      throw new NotFoundException('Registro não encontrado ou inativo.');
    }

    if (usuario.role !== Role.ADMINISTRADOR) {
      const nucleos = await this.nucleosDoUsuario(usuario.id);
      if (
        !registro.indicador.nucleoId ||
        !nucleos.includes(registro.indicador.nucleoId)
      ) {
        throw new ForbiddenException(
          'Você só pode enviar para revisão registros do seu núcleo.',
        );
      }
    }

    if (registro.valorRealizado === null) {
      throw new ConflictException(
        'Preencha o valor realizado antes de enviar para revisão.',
      );
    }

    return this.transicionar({
      id,
      de: [
        StatusAprovacao.EM_PREENCHIMENTO,
        StatusAprovacao.NECESSITA_CORRECAO,
      ],
      para: StatusAprovacao.ENVIADO_REVISAO,
      dados: { enviadoEm: new Date() },
      acao: AcaoAuditoria.ATUALIZAR,
      userId: usuario.id,
      ip,
      mensagemConflito:
        'Só registros em preenchimento ou que necessitam correção podem ser enviados para revisão.',
    });
  }

  // RF15: a gestão devolve o valor ao núcleo explicando o que corrigir
  async devolverComComentario(
    id: string,
    justificativa: string,
    autor: AutorAcao,
  ) {
    return this.transicionar({
      id,
      de: [StatusAprovacao.ENVIADO_REVISAO],
      para: StatusAprovacao.NECESSITA_CORRECAO,
      dados: { justificativaDevolucao: justificativa },
      acao: AcaoAuditoria.DEVOLVER,
      userId: autor.id,
      ip: autor.ip,
      auditoriaExtra: { justificativaDevolucao: justificativa },
      mensagemConflito:
        'Só registros enviados para revisão podem ser devolvidos.',
    });
  }

  // RF15: a gestão homologa o valor
  async aprovar(id: string, autor: AutorAcao) {
    const agora = new Date();
    return this.transicionar({
      id,
      de: [StatusAprovacao.ENVIADO_REVISAO],
      para: StatusAprovacao.APROVADO,
      dados: { aprovadorId: autor.id, revisadoEm: agora },
      acao: AcaoAuditoria.APROVAR,
      userId: autor.id,
      ip: autor.ip,
      auditoriaExtra: { aprovadorId: autor.id, revisadoEm: agora },
      mensagemConflito:
        'Só registros enviados para revisão podem ser aprovados.',
    });
  }

  // RF15: a administração publica o valor aprovado (passa a ser visível externamente)
  async publicar(id: string, autor: AutorAcao) {
    const agora = new Date();
    return this.transicionar({
      id,
      de: [StatusAprovacao.APROVADO],
      para: StatusAprovacao.PUBLICADO,
      dados: { publicadoPorId: autor.id, publicadoEm: agora },
      acao: AcaoAuditoria.PUBLICAR,
      userId: autor.id,
      ip: autor.ip,
      auditoriaExtra: { publicadoPorId: autor.id, publicadoEm: agora },
      mensagemConflito: 'Só registros aprovados podem ser publicados.',
    });
  }

  // RF11: inativa o registro sem excluí-lo
  async inativar(id: string, autor: AutorAcao) {
    const registro = await this.prisma.indicadorRegistro.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!registro) {
      throw new NotFoundException('Registro não encontrado.');
    }

    if (registro.status === StatusRegistro.INATIVO) {
      throw new ConflictException('O registro já está inativo.');
    }

    const inativado = await this.prisma.indicadorRegistro.update({
      where: { id },
      data: { status: StatusRegistro.INATIVO },
    });

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.DESATIVAR,
      entidade: 'IndicadorRegistro',
      entidadeId: id,
      dadosAntigos: { status: registro.status },
      dadosNovos: { status: StatusRegistro.INATIVO },
      ip: autor.ip,
    });

    return inativado;
  }

  // RF10: exclusão lógica do registro
  async remove(id: string, autor: AutorAcao) {
    const registro = await this.prisma.indicadorRegistro.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        indicadorId: true,
        ano: true,
        trimestre: true,
        valorRealizado: true,
        statusAprovacao: true,
        status: true,
      },
    });

    if (!registro) {
      throw new NotFoundException('Registro não encontrado.');
    }

    await this.prisma.indicadorRegistro.update({
      where: { id },
      data: { deletedAt: new Date(), status: StatusRegistro.INATIVO },
    });

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.EXCLUIR_LOGICO,
      entidade: 'IndicadorRegistro',
      entidadeId: id,
      dadosAntigos: {
        indicadorId: registro.indicadorId,
        ano: registro.ano,
        trimestre: registro.trimestre,
        valorRealizado: valorParaAuditoria(registro.valorRealizado),
        statusAprovacao: registro.statusAprovacao,
        status: registro.status,
      },
      dadosNovos: { excluido: true },
      ip: autor.ip,
    });

    return { message: 'Registro excluído com sucesso.' };
  }
}
