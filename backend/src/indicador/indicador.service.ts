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
  Prisma,
  Role,
  StatusAprovacao,
  StatusRegistro,
  TipoDadoIndicador,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { SalvarRegistroDto } from './dto/salvar-registro.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';

export interface UsuarioAutenticado {
  id: string;
  role: Role;
}

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

  // RF04: administração e Comunicação veem todos os núcleos; os demais, só os seus.
  // A Comunicação recebe apenas registros aprovados ou publicados (RN01).
  async findAll(usuario: UsuarioAutenticado) {
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
        status: StatusRegistro.ATIVO,
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

  // RF02: edita os dados descritivos do indicador
  async update(id: string, dados: UpdateIndicadorDto, autor: AutorAcao) {
    const atual = await this.prisma.indicador.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        nome: true,
        descricao: true,
        unidadeMedida: true,
        codigo: true,
      },
    });

    if (!atual) {
      throw new NotFoundException('Indicador não encontrado.');
    }

    const alteracoes: Prisma.IndicadorUpdateInput = {};
    if (dados.nome !== undefined) alteracoes.nome = dados.nome;
    if (dados.descricao !== undefined) alteracoes.descricao = dados.descricao;
    if (dados.unidadeMedida !== undefined)
      alteracoes.unidadeMedida = dados.unidadeMedida;
    if (dados.codigo !== undefined) alteracoes.codigo = dados.codigo;

    if (Object.keys(alteracoes).length === 0) {
      throw new BadRequestException('Nenhum campo informado para atualização.');
    }

    // Código duplicado vira 409 pelo PrismaExceptionFilter (P2002)
    const indicador = await this.prisma.indicador.update({
      where: { id },
      data: alteracoes,
      include: {
        nucleo: { select: { id: true, nome: true, sigla: true } },
        programa: { select: { id: true, nome: true } },
      },
    });

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Indicador',
      entidadeId: id,
      dadosAntigos: {
        nome: atual.nome,
        descricao: atual.descricao,
        unidadeMedida: atual.unidadeMedida,
        codigo: atual.codigo,
      },
      dadosNovos: {
        nome: indicador.nome,
        descricao: indicador.descricao,
        unidadeMedida: indicador.unidadeMedida,
        codigo: indicador.codigo,
      },
      ip: autor.ip,
    });

    return indicador;
  }

  // RF11: inativa o indicador sem excluí-lo, preservando o histórico
  async inativar(id: string, autor: AutorAcao) {
    const indicador = await this.prisma.indicador.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, nome: true, status: true },
    });

    if (!indicador) {
      throw new NotFoundException('Indicador não encontrado.');
    }

    if (indicador.status === StatusRegistro.INATIVO) {
      throw new ConflictException('O indicador já está inativo.');
    }

    const inativado = await this.prisma.indicador.update({
      where: { id },
      data: { status: StatusRegistro.INATIVO },
    });

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.DESATIVAR,
      entidade: 'Indicador',
      entidadeId: id,
      dadosAntigos: { status: indicador.status },
      dadosNovos: { status: StatusRegistro.INATIVO },
      ip: autor.ip,
    });

    return inativado;
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

    if (
      !ehAdministrador &&
      !STATUS_EDITAVEIS_NUCLEO.includes(existente.statusAprovacao)
    ) {
      throw new ConflictException(
        'Este valor já foi enviado para revisão e não pode mais ser alterado pelo núcleo.',
      );
    }

    const eraHomologado = STATUS_HOMOLOGADOS.includes(
      existente.statusAprovacao,
    );

    let novoStatus: StatusAprovacao;
    if (eraHomologado) {
      novoStatus = StatusAprovacao.ENVIADO_REVISAO;
    } else if (existente.statusAprovacao === StatusAprovacao.ENVIADO_REVISAO) {
      novoStatus = StatusAprovacao.ENVIADO_REVISAO;
    } else {
      novoStatus = StatusAprovacao.EM_PREENCHIMENTO;
    }

    const atualizado = await this.prisma.indicadorRegistro.update({
      where: { id: existente.id },
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
    });

    await this.audit.registrarAcao({
      userId: usuario.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'IndicadorRegistro',
      entidadeId: existente.id,
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
}
