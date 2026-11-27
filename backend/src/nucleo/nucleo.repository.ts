import { Injectable } from '@nestjs/common';
import { Prisma, StatusAprovacao, StatusRegistro } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const nucleoSelect = {
  id: true,
  nome: true,
  sigla: true,
  descricao: true,
  corHex: true,
  imagemUrl: true,
  status: true,
  createdAt: true,
} as const;

export const nucleoAssociadoSelect = {
  id: true,
  nome: true,
  sigla: true,
  imagemUrl: true,
} as const;

type ItemArquivado = { id: string; nome: string; status: StatusRegistro };

export type ResultadoExclusaoNucleo = {
  programasArquivados: ItemArquivado[];
  indicadoresArquivados: ItemArquivado[];
  usuariosDesvinculados: string[];
};

@Injectable()
export class NucleoRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Nome e sigla são únicos apenas entre núcleos não excluídos.
  // Na edição, `ignorarId` desconsidera o próprio núcleo.
  findConflito(nome: string, sigla: string, ignorarId?: string) {
    return this.prisma.nucleo.findFirst({
      where: {
        deletedAt: null,
        ...(ignorarId && { id: { not: ignorarId } }),
        OR: [
          { nome: { equals: nome, mode: 'insensitive' } },
          { sigla: { equals: sigla, mode: 'insensitive' } },
        ],
      },
      select: { nome: true, sigla: true },
    });
  }

  findConflitoOutro(nome?: string, sigla?: string, ignorarId?: string) {
    const condicoes: Prisma.NucleoWhereInput[] = [];
    if (nome) condicoes.push({ nome: { equals: nome, mode: 'insensitive' } });
    if (sigla)
      condicoes.push({ sigla: { equals: sigla, mode: 'insensitive' } });
    if (condicoes.length === 0) return null;

    return this.prisma.nucleo.findFirst({
      where: {
        deletedAt: null,
        NOT: ignorarId ? { id: ignorarId } : undefined,
        OR: condicoes,
      },
      select: { nome: true, sigla: true },
    });
  }

  // Página de resultados e total na mesma transação, para a contagem bater com os itens
  search(where: Prisma.NucleoWhereInput, skip: number, take: number) {
    return this.prisma.$transaction([
      this.prisma.nucleo.findMany({
        where,
        select: nucleoSelect,
        orderBy: { nome: 'asc' },
        skip,
        take,
      }),
      this.prisma.nucleo.count({ where }),
    ]);
  }

  findAtivoById(id: string) {
    return this.prisma.nucleo.findFirst({
      where: { id, deletedAt: null },
      select: nucleoSelect,
    });
  }

  async usuarioVinculado(nucleoId: string, userId: string) {
    const vinculo = await this.prisma.userNucleo.findUnique({
      where: { userId_nucleoId: { userId, nucleoId } },
      select: { nucleoId: true },
    });
    return vinculo !== null;
  }

  findAssociadosByUserId(userId: string) {
    return this.prisma.nucleo.findMany({
      where: {
        deletedAt: null,
        users: { some: { userId } },
      },
      select: nucleoAssociadoSelect,
      orderBy: { nome: 'asc' },
    });
  }

  create(data: Prisma.NucleoCreateInput) {
    return this.prisma.nucleo.create({ data, select: nucleoSelect });
  }

  // Exclusão lógica (UC027) em uma única transação: arquiva os programas e
  // indicadores vigentes do núcleo (como em UC031/UC041: só muda o status,
  // preservando o histórico), remove os vínculos de usuários e exclui o núcleo.
  // A exclusão do núcleo vem primeiro: o filtro em deletedAt trava a linha e
  // evita processar duas vezes em requisições concorrentes.
  // `aoExcluir` roda na mesma transação (ex.: auditoria); se falhar, nada é gravado.
  excluirComVinculos<T>(
    id: string,
    aoExcluir: (
      tx: Prisma.TransactionClient,
      resultado: ResultadoExclusaoNucleo,
    ) => Promise<T>,
  ): Promise<T | null> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.nucleo.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (count === 0) return null;

      const naoArquivado = {
        nucleoId: id,
        deletedAt: null,
        status: { not: StatusRegistro.ARQUIVADO },
      };

      const programas = await tx.programa.findMany({
        where: naoArquivado,
        select: { id: true, nome: true, status: true },
      });
      if (programas.length > 0) {
        await tx.programa.updateMany({
          where: { id: { in: programas.map((p) => p.id) } },
          data: { status: StatusRegistro.ARQUIVADO },
        });
      }

      const indicadores = await tx.indicador.findMany({
        where: naoArquivado,
        select: { id: true, nome: true, status: true },
      });
      if (indicadores.length > 0) {
        await tx.indicador.updateMany({
          where: { id: { in: indicadores.map((i) => i.id) } },
          data: { status: StatusRegistro.ARQUIVADO },
        });
      }

      const vinculos = await tx.userNucleo.findMany({
        where: { nucleoId: id },
        select: { userId: true },
      });
      await tx.userNucleo.deleteMany({ where: { nucleoId: id } });

      return aoExcluir(tx, {
        programasArquivados: programas,
        indicadoresArquivados: indicadores,
        usuariosDesvinculados: vinculos.map((v) => v.userId),
      });
    });
  }

  async updateDados(id: string, data: Prisma.NucleoUpdateManyMutationInput) {
    const { count } = await this.prisma.nucleo.updateMany({
      where: { id, deletedAt: null },
      data,
    });
    return count > 0;
  }

  async updateImagem(id: string, imagemUrl: string) {
    const { count } = await this.prisma.nucleo.updateMany({
      where: { id, deletedAt: null },
      data: { imagemUrl },
    });
    return count > 0;
  }

  async update(id: string, data: Prisma.NucleoUpdateInput) {
    return this.prisma.nucleo.update({
      where: { id },
      data,
      select: nucleoSelect,
    });
  }

  // Desativação mantém o núcleo e seus vínculos; não altera deletedAt.
  async deactivate(id: string) {
    const { count } = await this.prisma.nucleo.updateMany({
      where: { id, deletedAt: null, status: 'ATIVO' },
      data: { status: 'INATIVO' },
    });
    return count > 0;
  }

  // UC026 (RN03): reativa núcleo inativo ou arquivado sem perder histórico
  async reactivate(id: string) {
    const { count } = await this.prisma.nucleo.updateMany({
      where: { id, deletedAt: null, status: { not: StatusRegistro.ATIVO } },
      data: { status: StatusRegistro.ATIVO },
    });
    return count > 0;
  }

  // UC026 (RN04 / FE-026.01): identifica indicadores com medições em preenchimento ou em revisão
  async contarPendencias(nucleoId: string) {
    const statusPendentes: StatusAprovacao[] = [
      StatusAprovacao.EM_PREENCHIMENTO,
      StatusAprovacao.ENVIADO_REVISAO,
    ];

    const [totalIndicadoresPendentes, totalRegistrosPendentes] =
      await this.prisma.$transaction([
        this.prisma.indicador.count({
          where: {
            nucleoId,
            deletedAt: null,
            status: StatusRegistro.ATIVO,
            registros: {
              some: {
                deletedAt: null,
                status: StatusRegistro.ATIVO,
                statusAprovacao: { in: statusPendentes },
              },
            },
          },
        }),
        this.prisma.indicadorRegistro.count({
          where: {
            deletedAt: null,
            status: StatusRegistro.ATIVO,
            statusAprovacao: { in: statusPendentes },
            indicador: {
              nucleoId,
              deletedAt: null,
              status: StatusRegistro.ATIVO,
            },
          },
        }),
      ]);

    return {
      possuiPendencias: totalIndicadoresPendentes > 0,
      totalIndicadoresPendentes,
      totalRegistrosPendentes,
    };
  }
}
