import { TrimestreEnum } from '@prisma/client';
import { DashboardRepository } from './dashboard.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardRepository', () => {
  let prisma: { indicador: { findMany: jest.Mock } };
  let repository: DashboardRepository;

  const consultar = () =>
    repository.findIndicadores({
      where: { deletedAt: null },
      registros: { deletedAt: null, ano: 2026 },
      ano: 2026,
      trimestreMeta: TrimestreEnum.Q2,
    });

  beforeEach(() => {
    prisma = { indicador: { findMany: jest.fn().mockResolvedValue([]) } };
    repository = new DashboardRepository(prisma as unknown as PrismaService);
  });

  it('busca indicadores, metas e medições em uma única consulta (RNF01)', async () => {
    await consultar();

    expect(prisma.indicador.findMany).toHaveBeenCalledTimes(1);
  });

  it('ordena de forma estável para a resposta ser consistente entre requisições', async () => {
    await consultar();

    const [args] = prisma.indicador.findMany.mock.calls[0] as [
      {
        orderBy: unknown;
        select: { registros: { orderBy: unknown } };
      },
    ];
    expect(args.orderBy).toEqual([{ nome: 'asc' }, { id: 'asc' }]);
    expect(args.select.registros.orderBy).toEqual({ trimestre: 'asc' });
  });
});
