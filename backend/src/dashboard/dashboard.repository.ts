import { Injectable } from '@nestjs/common';
import { Prisma, TrimestreEnum } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface FiltroIndicadores {
  where: Prisma.IndicadorWhereInput;
  registros: Prisma.IndicadorRegistroWhereInput;
  ano: number;
  // nulo = meta anual
  trimestreMeta: TrimestreEnum | null;
}

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async usuarioPodeAcessarFiltros(
    userId: string,
    filtros: {
      nucleoId?: string;
      indicadorId?: string;
      programaId?: string;
      acaoId?: string;
    },
  ) {
    const verificacoes: Promise<boolean>[] = [];
    const escopoNucleo = { nucleo: { users: { some: { userId } } } };

    if (filtros.nucleoId) {
      verificacoes.push(
        this.prisma.userNucleo
          .findFirst({
            where: { userId, nucleoId: filtros.nucleoId },
            select: { userId: true },
          })
          .then((vinculo) => vinculo !== null),
      );
    }
    if (filtros.indicadorId) {
      verificacoes.push(
        this.prisma.indicador
          .findFirst({
            where: {
              id: filtros.indicadorId,
              deletedAt: null,
              ...escopoNucleo,
            },
            select: { id: true },
          })
          .then((indicador) => indicador !== null),
      );
    }
    if (filtros.programaId) {
      verificacoes.push(
        this.prisma.indicador
          .findFirst({
            where: {
              programaId: filtros.programaId,
              deletedAt: null,
              ...escopoNucleo,
            },
            select: { id: true },
          })
          .then((indicador) => indicador !== null),
      );
    }
    if (filtros.acaoId) {
      verificacoes.push(
        this.prisma.indicador
          .findFirst({
            where: { acaoId: filtros.acaoId, deletedAt: null, ...escopoNucleo },
            select: { id: true },
          })
          .then((indicador) => indicador !== null),
      );
    }

    return (await Promise.all(verificacoes)).every(Boolean);
  }

  // Uma única consulta traz indicadores, núcleo, meta do período e medições visíveis (RNF01)
  findIndicadores({ where, registros, ano, trimestreMeta }: FiltroIndicadores) {
    return this.prisma.indicador.findMany({
      where,
      select: {
        id: true,
        codigo: true,
        nome: true,
        tipoDado: true,
        unidadeMedida: true,
        escopo: true,
        nucleo: {
          select: { id: true, nome: true, sigla: true, corHex: true },
        },
        metas: {
          where: { ano, trimestre: trimestreMeta, deletedAt: null },
          select: { valorMeta: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        registros: {
          where: registros,
          select: {
            trimestre: true,
            valorRealizado: true,
            metaAplicada: true,
            statusAprovacao: true,
          },
          orderBy: { trimestre: 'asc' },
        },
      },
      // Desempate por id para a ordem ser estável entre requisições
      orderBy: [{ nome: 'asc' }, { id: 'asc' }],
    });
  }
}

export type IndicadorDashboard = Awaited<
  ReturnType<DashboardRepository['findIndicadores']>
>[number];
