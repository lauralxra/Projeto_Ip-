import { StatusRegistro } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NucleoRepository } from './nucleo.repository';

describe('NucleoRepository.excluirComVinculos', () => {
  let tx: {
    nucleo: { updateMany: jest.Mock };
    programa: { findMany: jest.Mock; updateMany: jest.Mock };
    indicador: { findMany: jest.Mock; updateMany: jest.Mock };
    userNucleo: { findMany: jest.Mock; deleteMany: jest.Mock };
  };
  let prisma: { $transaction: jest.Mock };
  let repository: NucleoRepository;
  const aoExcluir = jest.fn();

  const programa = {
    id: 'prog-1',
    nome: 'Programa A',
    status: StatusRegistro.ATIVO,
  };
  const indicador = {
    id: 'ind-1',
    nome: 'Indicador B',
    status: StatusRegistro.INATIVO,
  };
  const naoArquivado = {
    nucleoId: 'nucleo-uuid',
    deletedAt: null,
    status: { not: StatusRegistro.ARQUIVADO },
  };

  beforeEach(() => {
    tx = {
      nucleo: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      programa: {
        findMany: jest.fn().mockResolvedValue([programa]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      indicador: {
        findMany: jest.fn().mockResolvedValue([indicador]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      userNucleo: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]),
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    prisma = {
      $transaction: jest.fn((operacao: (cliente: typeof tx) => unknown) =>
        operacao(tx),
      ),
    };
    repository = new NucleoRepository(prisma as unknown as PrismaService);
    aoExcluir.mockReset().mockResolvedValue('feito');
  });

  it('exclui o núcleo, arquiva programas e indicadores e desvincula usuários na mesma transação', async () => {
    await expect(
      repository.excluirComVinculos('nucleo-uuid', aoExcluir),
    ).resolves.toBe('feito');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.nucleo.updateMany).toHaveBeenCalledWith({
      where: { id: 'nucleo-uuid', deletedAt: null },
      data: { deletedAt: expect.any(Date) as unknown },
    });

    // Só programas/indicadores vigentes e ainda não arquivados
    expect(tx.programa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: naoArquivado }),
    );
    expect(tx.programa.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['prog-1'] } },
      data: { status: StatusRegistro.ARQUIVADO },
    });
    expect(tx.indicador.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: naoArquivado }),
    );
    expect(tx.indicador.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['ind-1'] } },
      data: { status: StatusRegistro.ARQUIVADO },
    });

    expect(tx.userNucleo.deleteMany).toHaveBeenCalledWith({
      where: { nucleoId: 'nucleo-uuid' },
    });

    // O callback (auditoria) recebe o client da transação e o que foi alterado
    expect(aoExcluir).toHaveBeenCalledWith(tx, {
      programasArquivados: [programa],
      indicadoresArquivados: [indicador],
      usuariosDesvinculados: ['user-1', 'user-2'],
    });
  });

  it('não executa updates de arquivamento quando não há programas nem indicadores', async () => {
    tx.programa.findMany.mockResolvedValue([]);
    tx.indicador.findMany.mockResolvedValue([]);

    await repository.excluirComVinculos('nucleo-uuid', aoExcluir);

    expect(tx.programa.updateMany).not.toHaveBeenCalled();
    expect(tx.indicador.updateMany).not.toHaveBeenCalled();
    expect(aoExcluir).toHaveBeenCalledWith(tx, {
      programasArquivados: [],
      indicadoresArquivados: [],
      usuariosDesvinculados: ['user-1', 'user-2'],
    });
  });

  it('não mexe em vínculos se o núcleo já estava excluído', async () => {
    tx.nucleo.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.excluirComVinculos('nucleo-uuid', aoExcluir),
    ).resolves.toBeNull();

    expect(tx.programa.updateMany).not.toHaveBeenCalled();
    expect(tx.indicador.updateMany).not.toHaveBeenCalled();
    expect(tx.userNucleo.deleteMany).not.toHaveBeenCalled();
    expect(aoExcluir).not.toHaveBeenCalled();
  });

  it('erro no callback propaga para que o Prisma desfaça a transação', async () => {
    aoExcluir.mockRejectedValue(new Error('falha na auditoria'));

    await expect(
      repository.excluirComVinculos('nucleo-uuid', aoExcluir),
    ).rejects.toThrow('falha na auditoria');
  });
});
