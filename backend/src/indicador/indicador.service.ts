import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcaoAuditoria,
  EscopoIndicador,
  Role,
  StatusAprovacao,
  StatusRegistro,
  TipoDadoIndicador,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { FilterIndicadorDto } from './dto/filter-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
import { SalvarRegistroDto } from './dto/salvar-registro.dto';
import {
  alterarValorRegistro,
  STATUS_VISIVEIS_COMUNICACAO,
} from '../registro/regras-registro';

export interface UsuarioAutenticado {
  id: string;
  role: Role;
}

type MudancaStatusIndicador = {
  status: StatusRegistro;
  acao: AcaoAuditoria;
  mensagem: string;
};

const ARQUIVAR: MudancaStatusIndicador = {
  status: StatusRegistro.ARQUIVADO,
  acao: AcaoAuditoria.ARQUIVAR,
  mensagem: 'Indicador arquivado com sucesso.',
};

const DESATIVAR: MudancaStatusIndicador = {
  status: StatusRegistro.INATIVO,
  acao: AcaoAuditoria.DESATIVAR,
  mensagem: 'Indicador desativado com sucesso.',
};

const REATIVAR: MudancaStatusIndicador = {
  status: StatusRegistro.ATIVO,
  acao: AcaoAuditoria.RESTAURAR,
  mensagem: 'Indicador reativado com sucesso.',
};

@Injectable()
export class IndicadorService {
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

  // RF04 / UC041: por padrão retorna apenas indicadores ATIVOS (não polui a tela operacional).
  // Inativos ou arquivados só aparecem quando filtrados explicitamente por status.
  // Administração e Comunicação veem todos os núcleos; os demais, só os seus.
  // A Comunicação recebe apenas registros aprovados ou publicados (RN01).
  async findAll(usuario: UsuarioAutenticado, filtros?: FilterIndicadorDto) {
    const status = filtros?.status ?? StatusRegistro.ATIVO;
    const veTodosOsNucleos =
      usuario.role === Role.ADMINISTRADOR ||
      usuario.role === Role.EQUIPE_COMUNICACAO;

    const filtroNucleos = veTodosOsNucleos
      ? undefined
      : await this.nucleosDoUsuario(usuario.id);

    const somenteHomologados = usuario.role === Role.EQUIPE_COMUNICACAO;

    return this.prisma.indicador.findMany({
      where: {
        deletedAt: null,
        status,
        ...(filtroNucleos === undefined
          ? {}
          : {
              OR: [
                { escopo: EscopoIndicador.INSTITUCIONAL },
                { nucleoId: { in: filtroNucleos } },
              ],
            }),
      },
      include: {
        nucleo: { select: { id: true, nome: true, sigla: true } },
        programa: { select: { id: true, nome: true } },
        registros: {
          where: {
            deletedAt: null,
            status: StatusRegistro.ATIVO,
            ...(somenteHomologados
              ? { statusAprovacao: { in: STATUS_VISIVEIS_COMUNICACAO } }
              : {}),
          },
          orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }],
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  // RF04: mesmas regras de visibilidade do findAll, aplicadas a um único indicador
  async findOne(id: string, usuario: UsuarioAutenticado) {
    const ehAdministrador = usuario.role === Role.ADMINISTRADOR;
    const somenteHomologados = usuario.role === Role.EQUIPE_COMUNICACAO;

    const indicador = await this.prisma.indicador.findFirst({
      where: {
        id,
        deletedAt: null,
        // Indicadores inativos só aparecem para a administração
        ...(ehAdministrador ? {} : { status: StatusRegistro.ATIVO }),
      },
      include: {
        nucleo: { select: { id: true, nome: true, sigla: true } },
        programa: { select: { id: true, nome: true } },
        registros: {
          where: {
            deletedAt: null,
            status: StatusRegistro.ATIVO,
            ...(somenteHomologados
              ? { statusAprovacao: { in: STATUS_VISIVEIS_COMUNICACAO } }
              : {}),
          },
          orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }],
        },
      },
    });

    if (!indicador) {
      throw new NotFoundException('Indicador não encontrado.');
    }

    const veTodosOsNucleos =
      ehAdministrador || usuario.role === Role.EQUIPE_COMUNICACAO;

    if (
      !veTodosOsNucleos &&
      indicador.escopo !== EscopoIndicador.INSTITUCIONAL
    ) {
      const nucleos = await this.nucleosDoUsuario(usuario.id);
      if (!indicador.nucleoId || !nucleos.includes(indicador.nucleoId)) {
        throw new ForbiddenException(
          'Você só pode consultar indicadores do seu núcleo.',
        );
      }
    }

    return indicador;
  }

  async create(dados: CreateIndicadorDto, autor: AutorAcao) {
    if (dados.escopo === EscopoIndicador.NUCLEO && !dados.nucleoId) {
      throw new BadRequestException(
        'É obrigatório selecionar um núcleo para este indicador.',
      );
    }

    if (dados.escopo === EscopoIndicador.INSTITUCIONAL && dados.nucleoId) {
      throw new BadRequestException(
        'Indicadores institucionais não devem ter núcleo vinculado.',
      );
    }

    if (dados.nucleoId) {
      const nucleo = await this.prisma.nucleo.findFirst({
        where: {
          id: dados.nucleoId,
          deletedAt: null,
          status: StatusRegistro.ATIVO,
        },
      });

      if (!nucleo) {
        throw new BadRequestException('Núcleo não encontrado ou inativo.');
      }
    }

    if (dados.programaId) {
      const programa = await this.prisma.programa.findFirst({
        where: {
          id: dados.programaId,
          deletedAt: null,
          status: StatusRegistro.ATIVO,
          ...(dados.nucleoId ? { nucleoId: dados.nucleoId } : {}),
        },
      });

      if (!programa) {
        throw new BadRequestException(
          'Programa não encontrado, inativo ou incompatível com o núcleo.',
        );
      }
    }

    const indicador = await this.prisma.indicador.create({
      data: {
        nome: dados.nome,
        descricao: dados.descricao ?? null,
        unidadeMedida: dados.unidadeMedida ?? null,
        escopo: dados.escopo,
        tipoDado: dados.tipoDado ?? TipoDadoIndicador.NUMERICO,
        nucleoId: dados.nucleoId ?? null,
        programaId: dados.programaId ?? null,
        codigo: dados.codigo ?? null,
        status: dados.status ?? StatusRegistro.ATIVO,
      },
      include: {
        nucleo: { select: { id: true, nome: true, sigla: true } },
        programa: { select: { id: true, nome: true } },
        registros: true,
      },
    });

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.CRIAR,
      entidade: 'Indicador',
      entidadeId: indicador.id,
      dadosNovos: {
        nome: indicador.nome,
        escopo: indicador.escopo,
        nucleoId: indicador.nucleoId,
        programaId: indicador.programaId,
      },
      ip: autor.ip,
    });

    return indicador;
  }

  // RF02: edita os dados do indicador (descritivos, escopo, núcleo, programa, status, metas)
  async update(id: string, dados: UpdateIndicadorDto, autor: AutorAcao) {
    const indicador = await this.prisma.indicador.findFirst({
      where: { id, deletedAt: null },
      include: {
        nucleo: { select: { id: true, nome: true, sigla: true } },
        programa: { select: { id: true, nome: true } },
      },
    });

    if (!indicador) {
      throw new NotFoundException('Indicador não encontrado.');
    }

    // UC041 Regra 1: indicador arquivado/inativo não pode mais sofrer edições
    if (indicador.status && indicador.status !== StatusRegistro.ATIVO) {
      throw new ConflictException(
        'Não é possível editar um indicador inativo ou arquivado.',
      );
    }

    const nucleoId =
      dados.nucleoId !== undefined ? dados.nucleoId : indicador.nucleoId;
    const escopo = dados.escopo !== undefined ? dados.escopo : indicador.escopo;

    if (escopo === EscopoIndicador.NUCLEO && !nucleoId) {
      throw new BadRequestException(
        'É obrigatório vincular um núcleo ao indicador com escopo de núcleo.',
      );
    }

    if (escopo === EscopoIndicador.INSTITUCIONAL && nucleoId) {
      throw new BadRequestException(
        'Indicadores institucionais não devem ter núcleo vinculado.',
      );
    }

    if (dados.nucleoId) {
      const nucleo = await this.prisma.nucleo.findFirst({
        where: { id: dados.nucleoId, deletedAt: null, status: 'ATIVO' },
      });
      if (!nucleo) {
        throw new BadRequestException('Núcleo não encontrado ou inativo.');
      }
    }

    if (dados.programaId) {
      const programa = await this.prisma.programa.findFirst({
        where: {
          id: dados.programaId,
          deletedAt: null,
          status: 'ATIVO',
          ...(nucleoId ? { nucleoId } : {}),
        },
      });
      if (!programa) {
        throw new BadRequestException(
          'Programa não encontrado, inativo ou incompatível com o núcleo.',
        );
      }
    }

    const atualizado = await this.prisma.indicador.update({
      where: { id },
      data: {
        ...(dados.nome ? { nome: dados.nome.trim() } : {}),
        ...(dados.descricao !== undefined
          ? { descricao: dados.descricao?.trim() || null }
          : {}),
        ...(dados.unidadeMedida !== undefined
          ? { unidadeMedida: dados.unidadeMedida?.trim() || null }
          : {}),
        ...(dados.escopo ? { escopo: dados.escopo } : {}),
        ...(dados.tipoDado ? { tipoDado: dados.tipoDado } : {}),
        ...(dados.status !== undefined ? { status: dados.status } : {}),
        ...(dados.nucleoId !== undefined
          ? { nucleoId: dados.nucleoId || null }
          : {}),
        ...(dados.programaId !== undefined
          ? { programaId: dados.programaId || null }
          : {}),
        ...(dados.codigo !== undefined
          ? { codigo: dados.codigo?.trim() || null }
          : {}),
      },
      include: {
        nucleo: { select: { id: true, nome: true, sigla: true } },
        programa: { select: { id: true, nome: true } },
        registros: {
          where: { deletedAt: null },
          orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }],
        },
      },
    });

    if (dados.semMeta) {
      const agora = new Date();
      await this.prisma.$transaction([
        this.prisma.meta.updateMany({
          where: { indicadorId: id, deletedAt: null },
          data: { deletedAt: agora, status: StatusRegistro.INATIVO },
        }),
        this.prisma.indicadorRegistro.updateMany({
          where: { indicadorId: id, deletedAt: null },
          data: { metaAplicada: null },
        }),
      ]);
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Indicador',
      entidadeId: id,
      dadosAntigos: {
        nome: indicador.nome,
        descricao: indicador.descricao,
        unidadeMedida: indicador.unidadeMedida,
        codigo: indicador.codigo,
        escopo: indicador.escopo,
        nucleoId: indicador.nucleoId,
        programaId: indicador.programaId,
      },
      dadosNovos: {
        nome: atualizado.nome,
        descricao: atualizado.descricao,
        unidadeMedida: atualizado.unidadeMedida,
        codigo: atualizado.codigo,
        escopo: atualizado.escopo,
        nucleoId: atualizado.nucleoId,
        programaId: atualizado.programaId,
        ...(dados.semMeta ? { semMeta: true } : {}),
      },
      ip: autor.ip,
    });

    return atualizado;
  }

  // UC041: arquivar/desativar muda apenas o status, preservando 100% do histórico
  arquivar(id: string, autor: AutorAcao) {
    return this.alterarStatus(id, ARQUIVAR, autor);
  }

  desativar(id: string, autor: AutorAcao) {
    return this.alterarStatus(id, DESATIVAR, autor);
  }

  // RF11: inativar é sinônimo de desativar (muda status para INATIVO e audita DESATIVAR)
  inativar(id: string, autor: AutorAcao) {
    return this.desativar(id, autor);
  }

  reativar(id: string, autor: AutorAcao) {
    return this.alterarStatus(id, REATIVAR, autor);
  }

  private async alterarStatus(
    id: string,
    mudanca: MudancaStatusIndicador,
    autor: AutorAcao,
  ) {
    const atual = await this.prisma.indicador.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, nome: true, status: true, nucleoId: true },
    });

    if (!atual) {
      throw new NotFoundException('Indicador não encontrado.');
    }

    if (atual.status === mudanca.status) {
      throw new ConflictException(
        `O indicador já está ${mudanca.status.toLowerCase()}.`,
      );
    }

    // Atualização atômica condicionada ao status lido para evitar auditoria duplicada
    // em requisições simultâneas. Nenhum registro histórico ou meta é alterado.
    const { count } = await this.prisma.indicador.updateMany({
      where: { id, deletedAt: null, status: atual.status },
      data: { status: mudanca.status },
    });

    if (count === 0) {
      throw new ConflictException(
        'O indicador foi alterado por outra operação. Tente novamente.',
      );
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: mudanca.acao,
      entidade: 'Indicador',
      entidadeId: id,
      dadosAntigos: {
        nome: atual.nome,
        status: atual.status,
      },
      dadosNovos: {
        nome: atual.nome,
        status: mudanca.status,
      },
      ip: autor.ip,
    });

    return { message: mudanca.mensagem, status: mudanca.status };
  }

  // RF03: remove um indicador por vez (exclusão lógica), levando junto metas e registros
  async remove(id: string, autor: AutorAcao) {
    const indicador = await this.prisma.indicador.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, nome: true, status: true, nucleoId: true },
    });

    if (!indicador) {
      throw new NotFoundException('Indicador não encontrado.');
    }

    const agora = new Date();
    const excluido = { deletedAt: agora, status: StatusRegistro.INATIVO };

    const [registros, metas] = await this.prisma.$transaction([
      this.prisma.indicadorRegistro.updateMany({
        where: { indicadorId: id, deletedAt: null },
        data: excluido,
      }),
      this.prisma.meta.updateMany({
        where: { indicadorId: id, deletedAt: null },
        data: excluido,
      }),
      this.prisma.indicador.update({ where: { id }, data: excluido }),
    ]);

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.EXCLUIR_LOGICO,
      entidade: 'Indicador',
      entidadeId: id,
      dadosAntigos: {
        nome: indicador.nome,
        status: indicador.status,
        nucleoId: indicador.nucleoId,
      },
      dadosNovos: {
        excluido: true,
        registrosExcluidos: registros.count,
        metasExcluidas: metas.count,
      },
      ip: autor.ip,
    });

    return { message: 'Indicador excluído com sucesso.' };
  }

  // RF08/RF09: cria ou atualiza o valor do trimestre respeitando o fluxo de status
  async salvarRegistro(
    indicadorId: string,
    dados: SalvarRegistroDto,
    usuario: UsuarioAutenticado,
    ip?: string,
  ) {
    const indicador = await this.prisma.indicador.findFirst({
      where: {
        id: indicadorId,
        deletedAt: null,
        status: StatusRegistro.ATIVO,
      },
      select: { id: true, nucleoId: true },
    });

    if (!indicador) {
      throw new NotFoundException('Indicador não encontrado ou inativo.');
    }

    const ehAdministrador = usuario.role === Role.ADMINISTRADOR;

    // RN02: Direção de Núcleo só preenche indicadores do próprio núcleo;
    // indicadores institucionais ficam com a administração
    if (!ehAdministrador) {
      const nucleos = await this.nucleosDoUsuario(usuario.id);
      if (!indicador.nucleoId || !nucleos.includes(indicador.nucleoId)) {
        throw new ForbiddenException(
          'Você só pode registrar valores de indicadores do seu núcleo.',
        );
      }
    }

    const existente = await this.prisma.indicadorRegistro.findFirst({
      where: {
        indicadorId: indicador.id,
        ano: dados.ano,
        trimestre: dados.trimestre,
        deletedAt: null,
      },
    });

    if (!existente) {
      const criado = await this.prisma.indicadorRegistro.create({
        data: {
          indicadorId: indicador.id,
          ano: dados.ano,
          trimestre: dados.trimestre,
          valorRealizado: dados.valorRealizado,
          statusAprovacao: StatusAprovacao.EM_PREENCHIMENTO,
          responsavelId: usuario.id,
        },
      });

      await this.audit.registrarAcao({
        userId: usuario.id,
        acao: AcaoAuditoria.CRIAR,
        entidade: 'IndicadorRegistro',
        entidadeId: criado.id,
        dadosNovos: {
          indicadorId: indicador.id,
          ano: dados.ano,
          trimestre: dados.trimestre,
          valorRealizado: dados.valorRealizado,
          statusAprovacao: criado.statusAprovacao,
        },
        ip,
      });

      return criado;
    }

    // Mesma regra de PATCH /registros/:id: valor inativo, fluxo de aprovação
    // (RN02/RN04) e proteção contra alterações concorrentes
    await alterarValorRegistro(
      this.prisma,
      this.audit,
      existente,
      dados.valorRealizado,
      usuario,
      ip,
    );

    return this.prisma.indicadorRegistro.findUniqueOrThrow({
      where: { id: existente.id },
    });
  }
}
