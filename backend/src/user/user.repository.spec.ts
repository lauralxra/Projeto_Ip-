import { PrismaService } from '../prisma/prisma.service';
import { UserRepository } from './user.repository';

describe('UserRepository.softDelete', () => {
  let tx: {
    user: { updateMany: jest.Mock };
    userNucleo: { findMany: jest.Mock; deleteMany: jest.Mock };
  };
  let repository: UserRepository;

  beforeEach(() => {
    tx = {
      user: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      userNucleo: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ nucleoId: 'nei' }, { nucleoId: 'nuri' }]),
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((operacao: (cliente: typeof tx) => unknown) =>
        operacao(tx),
      ),
    };
    repository = new UserRepository(prisma as unknown as PrismaService);
  });

  it('exclui o usuário e remove os vínculos com núcleos na mesma transação', async () => {
    await expect(repository.softDelete('user-uuid')).resolves.toEqual({
      count: 1,
      nucleoIds: ['nei', 'nuri'],
    });

    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-uuid', deletedAt: null },
      data: { deletedAt: expect.any(Date) as unknown, ativo: false },
    });
    expect(tx.userNucleo.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-uuid' },
    });
  });

  it('não mexe nos vínculos se o usuário já estava excluído', async () => {
    tx.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(repository.softDelete('user-uuid')).resolves.toEqual({
      count: 0,
      nucleoIds: [],
    });
    expect(tx.userNucleo.deleteMany).not.toHaveBeenCalled();
  });
});
