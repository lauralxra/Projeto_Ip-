import {
  BadRequestException,
  ConflictException,
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
  TrimestreEnum,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';
import type { AuthenticatedUser } from '../auth/interface/request.interface';
import { calcularRealizado, percentualAtingido } from '../common/realizado';
import { CreateMetaDto } from './dto/create-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';
import { FilterMetaDto } from './dto/filter-meta.dto';

// Mesmo alcance do dashboard (RN01): Comunicação e Gestão veem todos os núcleos,
// com o realizado só de valores homologados; a Direção de Núcleo vê os indicadores
// institucionais e os dos seus núcleos. Só a Administração vê metas de indicadores inativos.
const PERFIS_SOMENTE_HOMOLOGADOS: Role[] = [
  Role.EQUIPE_COMUNICACAO,
  Role.EQUIPE_GESTAO,
];

const STATUS_HOMOLOGADOS: StatusAprovacao[] = [
  StatusAprovacao.APROVADO,
  StatusAprovacao.PUBLICADO,
];

const LIMITE_PERCENTUAL = 100;

const INCLUDE_INDICADOR = {
  indicador: {
    select: {
      id: true,
      nome: true,
      codigo: true,
      unidadeMedida: true,
      tipoDado: true,
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

const descreverPeriodo = (ano: number, trimestre: TrimestreEnum | null) =>
  trimestre
    ? `Já existe uma meta para este indicador em ${trimestre}/${ano}.`
    : `Já existe uma meta anual para este indicador em ${ano}.`;

const ehViolacaoDeUnicidade = (erro: unknown) =>
  erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002';

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
    const indicadorAtivo: Prisma.IndicadorWhereInput = {
      deletedAt: null,
      status: StatusRegistro.ATIVO,
    };

    if (PERFIS_SOMENTE_HOMOLOGADOS.includes(usuario.role)) {
      return { ...base, indicador: indicadorAtivo };
    }

    const nucleos = await this.nucleosDoUsuario(usuario.id);
    return {
      ...base,
      indicador: {
        ...indicadorAtivo,
        OR: [
          { escopo: EscopoIndicador.INSTITUCIONAL },
          { nucleoId: { in: nucleos } },
        ],
      },
    };
  }

  // Comparação realizado x meta (RF21), com o mesmo cálculo do dashboard:
  // meta trimestral usa o valor do trimestre; meta anual consolida o ano
  // (soma para numérico e moeda, última medição para percentual).
  private async comRealizado(
    metas: MetaComIndicador[],
    somenteHomologados: boolean,
  ) {
    const registros = metas.length
      ? await this.prisma.indicadorRegistro.findMany({
          where: {
            deletedAt: null,
            status: StatusRegistro.ATIVO,
            indicadorId: { in: [...new Set(metas.map((m) => m.indicadorId))] },
            ano: { in: [...new Set(metas.map((m) => m.ano))] },
            ...(somenteHomologados && {
              statusAprovacao: { in: STATUS_HOMOLOGADOS },
            }),
          },
          select: {
            indicadorId: true,
            ano: true,
            trimestre: true,
            valorRealizado: true,
            statusAprovacao: true,
          },
          orderBy: { trimestre: 'asc' },
        })
      : [];

    const porIndicadorEAno = new Map<string, typeof registros>();
    for (const registro of registros) {
      const chave = `${registro.indicadorId}|${registro.ano}`;
      porIndicadorEAno.set(chave, [
        ...(porIndicadorEAno.get(chave) ?? []),
        registro,
      ]);
    }

    return metas.map((meta) => {
      const doAno =
        porIndicadorEAno.get(`${meta.indicadorId}|${meta.ano}`) ?? [];
      const considerados = meta.trimestre
        ? doAno.filter((r) => r.trimestre === meta.trimestre)
        : doAno;

      const valorMeta = meta.valorMeta.toNumber();
      const valorRealizado = calcularRealizado(
        meta.indicador.tipoDado,
        considerados.map((r) => r.valorRealizado),
      );

      return {
        ...meta,
        valorMeta,
        valorRealizado,
        percentualAtingido: percentualAtingido(valorRealizado, valorMeta),
        // Na meta anual o realizado junta vários trimestres, cada um com seu status
        statusAprovacaoRealizado: meta.trimestre
          ? (considerados[0]?.statusAprovacao ?? null)
          : null,
        trimestresConsiderados: considerados.map((r) => r.trimestre),
      };
    });
  }

  private validarValor(tipoDado: TipoDadoIndicador, valorMeta: number) {
    if (
      tipoDado === TipoDadoIndicador.PERCENTUAL &&
      valorMeta > LIMITE_PERCENTUAL
    ) {
      throw new BadRequestException(
        'A meta de um indicador percentual não pode passar de 100.',
      );
    }
  }

  // RF20: cadastra a meta de um indicador ativo para um período
  async create(dados: CreateMetaDto, autor: AutorAcao) {
    const indicador = await this.prisma.indicador.findFirst({
      where: {
        id: dados.indicadorId,
        deletedAt: null,
        status: StatusRegistro.ATIVO,
      },
      select: { id: true, tipoDado: true },
    });

    if (!indicador) {
      throw new BadRequestException('Indicador não encontrado ou inativo.');
    }

    this.validarValor(indicador.tipoDado, dados.valorMeta);

    const trimestre = dados.trimestre ?? null;

    // Verificação prévia para uma mensagem clara; o índice único
    // (migration 20261118120000_metas_unicidade_periodo) cobre requisições simultâneas
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
      throw new ConflictException(descreverPeriodo(dados.ano, trimestre));
    }

    let meta: MetaComIndicador;
    try {
      meta = await this.prisma.meta.create({
        data: {
          indicadorId: dados.indicadorId,
          ano: dados.ano,
          trimestre,
          valorMeta: dados.valorMeta,
          descricao: dados.descricao ?? null,
        },
        include: INCLUDE_INDICADOR,
      });
    } catch (erro) {
      if (ehViolacaoDeUnicidade(erro)) {
        throw new ConflictException(descreverPeriodo(dados.ano, trimestre));
      }
      throw erro;
    }

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
  async findAll(filtros: FilterMetaDto, usuario: AuthenticatedUser) {
    const { pagina, limite } = filtros;

    const where: Prisma.MetaWhereInput = {
      AND: [
        await this.filtroVisibilidade(usuario),
        {
          ...(filtros.indicadorId && { indicadorId: filtros.indicadorId }),
          ...(filtros.nucleoId && {
            indicador: { nucleoId: filtros.nucleoId },
          }),
          ...(filtros.ano && { ano: filtros.ano }),
          ...(filtros.trimestre && { trimestre: filtros.trimestre }),
          ...(filtros.anual === true && { trimestre: null }),
          ...(filtros.anual === false && { trimestre: { not: null } }),
        },
      ],
    };

    const [metas, total] = await this.prisma.$transaction([
      this.prisma.meta.findMany({
        where,
        include: INCLUDE_INDICADOR,
        orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }, { id: 'asc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.meta.count({ where }),
    ]);

    return {
      itens: await this.comRealizado(
        metas,
        PERFIS_SOMENTE_HOMOLOGADOS.includes(usuario.role),
      ),
      total,
      pagina,
      limite,
    };
  }

  async findOne(id: string, usuario: AuthenticatedUser) {
    const meta = await this.prisma.meta.findFirst({
      where: { AND: [{ id }, await this.filtroVisibilidade(usuario)] },
      include: INCLUDE_INDICADOR,
    });

    // 404 também sem permissão, para não revelar metas de outros núcleos
    if (!meta) {
      throw new NotFoundException('Meta não encontrada.');
    }

    const [comparada] = await this.comRealizado(
      [meta],
      PERFIS_SOMENTE_HOMOLOGADOS.includes(usuario.role),
    );
    return comparada;
  }

  // RF21: altera o valor e a descrição da meta
  async update(id: string, dados: UpdateMetaDto, autor: AutorAcao) {
    const atual = await this.prisma.meta.findFirst({
      where: { id, deletedAt: null },
      select: {
        valorMeta: true,
        descricao: true,
        indicador: { select: { tipoDado: true, status: true } },
      },
    });

    if (!atual) {
      throw new NotFoundException('Meta não encontrada.');
    }

    if (atual.indicador.status && atual.indicador.status !== StatusRegistro.ATIVO) {
      throw new ConflictException(
        'Não é possível alterar metas de um indicador inativo ou arquivado.',
      );
    }

    const alteracoes: Prisma.MetaUpdateManyMutationInput = {};
    if (dados.valorMeta !== undefined) {
      this.validarValor(atual.indicador.tipoDado, dados.valorMeta);
      alteracoes.valorMeta = dados.valorMeta;
    }
    if (dados.descricao !== undefined) alteracoes.descricao = dados.descricao;

    if (Object.keys(alteracoes).length === 0) {
      throw new BadRequestException('Nenhum campo informado para atualização.');
    }

    // Não grava sobre uma meta excluída por outra requisição no meio tempo
    const { count } = await this.prisma.meta.updateMany({
      where: { id, deletedAt: null },
      data: alteracoes,
    });
    if (count === 0) {
      throw new NotFoundException('Meta não encontrada.');
    }

    const meta = await this.prisma.meta.findUniqueOrThrow({
      where: { id },
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

    // O filtro em deletedAt evita excluir (e auditar) duas vezes em requisições concorrentes
    const { count } = await this.prisma.meta.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), status: StatusRegistro.INATIVO },
    });
    if (count === 0) {
      throw new NotFoundException('Meta não encontrada.');
    }

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
