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
      orderBy: { nome: 'asc' },
    });
  }
}

export type IndicadorDashboard = Awaited<
  ReturnType<DashboardRepository['findIndicadores']>
>[number];
