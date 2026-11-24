import { PrismaService } from '../prisma/prisma.service';
import { NucleoRepository } from './nucleo.repository';

describe('NucleoRepository.findAtivoComVinculos', () => {
  it('não conta usuários excluídos como vínculo que impede a exclusão', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const repository = new NucleoRepository({
      nucleo: { findFirst },
    } as unknown as PrismaService);

    await repository.findAtivoComVinculos('nucleo-uuid');

    const [args] = findFirst.mock.calls[0] as [
      { select: { _count: { select: Record<string, unknown> } } },
    ];
    expect(args.select._count.select).toEqual({
      users: { where: { user: { deletedAt: null } } },
      programas: { where: { deletedAt: null } },
      indicadores: { where: { deletedAt: null } },
    });
  });
});
