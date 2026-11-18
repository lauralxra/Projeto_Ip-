import {
  BadRequestException,
  ConflictException,
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
import { CreateMetaDto } from './dto/create-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';

// RN01: só dado homologado chega à Comunicação
const STATUS_VISIVEIS_COMUNICACAO: StatusAprovacao[] = [
  StatusAprovacao.APROVADO,
  StatusAprovacao.PUBLICADO,
];

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
} satisfies Prisma.MetaInclude;

type MetaComIndicador = Prisma.MetaGetPayload<{
  include: typeof INCLUDE_INDICADOR;
}>;

const decimalParaAuditoria = (valor: Prisma.Decimal | null | undefined) =>
  valor === null || valor === undefined ? null : valor.toString();

@Injectable()
export class MetaService {
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

  // Administração vê tudo (inclusive metas inativas); Comunicação vê todos os
  // núcleos; os demais perfis, só as metas dos indicadores dos seus núcleos
  private async filtroVisibilidade(
    usuario: AuthenticatedUser,
  ): Promise<Prisma.MetaWhereInput> {
    if (usuario.role === Role.ADMINISTRADOR) {
      return { deletedAt: null, indicador: { deletedAt: null } };
    }

    const base: Prisma.MetaWhereInput = {
      deletedAt: null,
      status: StatusRegistro.ATIVO,
    };

    if (usuario.role === Role.EQUIPE_COMUNICACAO) {
      return { ...base, indicador: { deletedAt: null } };
    }

    const nucleos = await this.nucleosDoUsuario(usuario.id);
    return {
      ...base,
      indicador: { deletedAt: null, nucleoId: { in: nucleos } },
    };
  }

  // Comparação realizado x meta: anexa a cada meta o valor registrado no mesmo
  // indicador, ano e trimestre. Metas anuais (sem trimestre) ficam com null.
  private async comRealizado(
    metas: MetaComIndicador[],
    somenteHomologados: boolean,
  ) {
    const trimestrais = metas.filter((m) => m.trimestre !== null);

    const registros = trimestrais.length
      ? await this.prisma.indicadorRegistro.findMany({
          where: {
            deletedAt: null,
            status: StatusRegistro.ATIVO,
            indicadorId: {
              in: [...new Set(trimestrais.map((m) => m.indicadorId))],
            },
            ano: { in: [...new Set(trimestrais.map((m) => m.ano))] },
            ...(somenteHomologados
              ? { statusAprovacao: { in: STATUS_VISIVEIS_COMUNICACAO } }
              : {}),
          },
          select: {
            indicadorId: true,
            ano: true,
            trimestre: true,
            valorRealizado: true,
            statusAprovacao: true,
          },
        })
      : [];

    const chave = (indicadorId: string, ano: number, trimestre: string) =>
      `${indicadorId}|${ano}|${trimestre}`;
    const porPeriodo = new Map(
      registros.map((r) => [chave(r.indicadorId, r.ano, r.trimestre), r]),
    );

    return metas.map((meta) => {
      const registro = meta.trimestre
        ? porPeriodo.get(chave(meta.indicadorId, meta.ano, meta.trimestre))
        : undefined;
      return {
        ...meta,
        valorRealizado: registro?.valorRealizado ?? null,
        statusAprovacaoRealizado: registro?.statusAprovacao ?? null,
      };
    });
  }

  // RF20: cadastra a meta de um indicador ativo para um período
  async create(dados: CreateMetaDto, autor: AutorAcao) {
    const indicador = await this.prisma.indicador.findFirst({
      where: {
        id: dados.indicadorId,
        deletedAt: null,
        status: StatusRegistro.ATIVO,
      },
      select: { id: true },
    });

    if (!indicador) {
      throw new BadRequestException('Indicador não encontrado ou inativo.');
    }

    const trimestre = dados.trimestre ?? null;

    // Não há índice único no banco: a duplicidade é verificada aqui
    const duplicada = await this.prisma.meta.findFirst({
      where: {
        indicadorId: dados.indicadorId,
        ano: dados.ano,
        trimestre,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (duplicada) {
      throw new ConflictException(
        trimestre
          ? `Já existe uma meta para este indicador em ${trimestre}/${dados.ano}.`
          : `Já existe uma meta anual para este indicador em ${dados.ano}.`,
      );
    }

    const meta = await this.prisma.meta.create({
      data: {
        indicadorId: dados.indicadorId,
        ano: dados.ano,
        trimestre,
        valorMeta: dados.valorMeta,
        descricao: dados.descricao ?? null,
      },
      include: INCLUDE_INDICADOR,
    });

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.CRIAR,
      entidade: 'Meta',
      entidadeId: meta.id,
      dadosNovos: {
        indicadorId: meta.indicadorId,
        ano: meta.ano,
        trimestre: meta.trimestre,
        valorMeta: dados.valorMeta,
        descricao: meta.descricao,
      },
      ip: autor.ip,
    });

    const [comparada] = await this.comRealizado([meta], false);
    return comparada;
  }

  // RF21: lista as metas com o realizado do mesmo período
  async findAll(usuario: AuthenticatedUser) {
    const metas = await this.prisma.meta.findMany({
      where: await this.filtroVisibilidade(usuario),
      include: INCLUDE_INDICADOR,
      orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }],
    });

    return this.comRealizado(metas, usuario.role === Role.EQUIPE_COMUNICACAO);
  }

  async findOne(id: string, usuario: AuthenticatedUser) {
    const filtro = await this.filtroVisibilidade(usuario);
    const meta = await this.prisma.meta.findFirst({
      where: { AND: [{ id }, filtro] },
      include: INCLUDE_INDICADOR,
    });

    // 404 também sem permissão, para não revelar metas de outros núcleos
    if (!meta) {
      throw new NotFoundException('Meta não encontrada.');
    }

    const [comparada] = await this.comRealizado(
      [meta],
      usuario.role === Role.EQUIPE_COMUNICACAO,
    );
    return comparada;
  }

  // RF21: altera o valor e a descrição da meta
  async update(id: string, dados: UpdateMetaDto, autor: AutorAcao) {
    const atual = await this.prisma.meta.findFirst({
      where: { id, deletedAt: null },
      select: { valorMeta: true, descricao: true },
    });

    if (!atual) {
      throw new NotFoundException('Meta não encontrada.');
    }

    const alteracoes: Prisma.MetaUpdateInput = {};
    if (dados.valorMeta !== undefined) alteracoes.valorMeta = dados.valorMeta;
    if (dados.descricao !== undefined) alteracoes.descricao = dados.descricao;

    if (Object.keys(alteracoes).length === 0) {
      throw new BadRequestException('Nenhum campo informado para atualização.');
    }

    const meta = await this.prisma.meta.update({
      where: { id },
      data: alteracoes,
      include: INCLUDE_INDICADOR,
    });

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Meta',
      entidadeId: id,
      dadosAntigos: {
        valorMeta: decimalParaAuditoria(atual.valorMeta),
        descricao: atual.descricao,
      },
      dadosNovos: {
        valorMeta: decimalParaAuditoria(meta.valorMeta),
        descricao: meta.descricao,
      },
      ip: autor.ip,
    });

    const [comparada] = await this.comRealizado([meta], false);
    return comparada;
  }

  // Exclusão lógica da meta
  async remove(id: string, autor: AutorAcao) {
    const meta = await this.prisma.meta.findFirst({
      where: { id, deletedAt: null },
      select: {
        indicadorId: true,
        ano: true,
        trimestre: true,
        valorMeta: true,
        status: true,
      },
    });

    if (!meta) {
      throw new NotFoundException('Meta não encontrada.');
    }

    await this.prisma.meta.update({
      where: { id },
      data: { deletedAt: new Date(), status: StatusRegistro.INATIVO },
    });

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.EXCLUIR_LOGICO,
      entidade: 'Meta',
      entidadeId: id,
      dadosAntigos: {
        indicadorId: meta.indicadorId,
        ano: meta.ano,
        trimestre: meta.trimestre,
        valorMeta: decimalParaAuditoria(meta.valorMeta),
        status: meta.status,
      },
      dadosNovos: { excluido: true },
      ip: autor.ip,
    });

    return { message: 'Meta excluída com sucesso.' };
  }
}
