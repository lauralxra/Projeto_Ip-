import { Role, StatusImportacao } from '@prisma/client';
import { ImportacaoService } from './importacao.service';

describe('ImportacaoService', () => {
  let service: ImportacaoService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      importacao: {
        create: jest.fn(),
        update: jest.fn(),
      },
      nucleo: {
        findFirst: jest.fn(),
      },
      programa: {
        findFirst: jest.fn(),
      },
      indicador: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      indicadorRegistro: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new ImportacaoService(prisma);
  });

  it('deve exigir núcleo e programa no cabeçalho da importação', async () => {
    await expect(
      service.importarCsv(
        'indicadores.csv',
        'nomeIndicador,ano,trimestre,valorRealizado\nIndicador sem contexto,2025,Q1,42.5',
        'user-1',
        Role.ADMINISTRADOR,
      ),
    ).rejects.toThrow('Cabeçalho obrigatório: deve conter nucleo e programa');
  });

  it('deve usar unidade como padrão quando o CSV não informa unidade de medida', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      perfil: Role.ADMINISTRADOR,
      nucleos: [],
    });

    prisma.importacao.create.mockResolvedValue({ id: 'importacao-1' });
    prisma.importacao.update.mockResolvedValue({
      id: 'importacao-1',
      status: StatusImportacao.CONCLUIDA,
    });

    prisma.nucleo.findFirst.mockResolvedValue({
      id: 'nucleo-001',
      nome: 'Núcleo Teste',
      status: 'ATIVO',
      deletedAt: null,
    });
    prisma.programa.findFirst.mockResolvedValue({
      id: 'programa-001',
      nome: 'Programa Teste',
      nucleoId: 'nucleo-001',
      status: 'ATIVO',
      deletedAt: null,
    });
    prisma.indicador.findFirst.mockResolvedValue(null);
    prisma.indicador.create.mockResolvedValue({
      id: 'indicador-321',
      nome: 'Indicador sem unidade',
      status: 'ATIVO',
      deletedAt: null,
      nucleoId: 'nucleo-001',
      programaId: 'programa-001',
    });
    prisma.indicadorRegistro.findFirst.mockResolvedValue(null);
    prisma.indicadorRegistro.create.mockResolvedValue({ id: 'registro-1' });

    await service.importarCsv(
      'indicadores.csv',
      'nomeIndicador,nucleo,programa,ano,trimestre,valorRealizado\nIndicador sem unidade,Núcleo Teste,Programa Teste,2025,Q1,42.5',
      'user-1',
      Role.ADMINISTRADOR,
    );

    expect(prisma.indicador.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          unidadeMedida: 'unidade',
        }),
      }),
    );
  });

  it('deve criar um indicador automaticamente quando o CSV não envia indicadorId', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      perfil: Role.ADMINISTRADOR,
      nucleos: [],
    });

    prisma.importacao.create.mockResolvedValue({ id: 'importacao-1' });
    prisma.importacao.update.mockResolvedValue({
      id: 'importacao-1',
      status: StatusImportacao.CONCLUIDA,
    });

    prisma.nucleo.findFirst.mockResolvedValue({
      id: 'nucleo-123',
      nome: 'Núcleo Teste',
      status: 'ATIVO',
      deletedAt: null,
    });
    prisma.programa.findFirst.mockResolvedValue({
      id: 'programa-123',
      nome: 'Programa Teste',
      nucleoId: 'nucleo-123',
      status: 'ATIVO',
      deletedAt: null,
    });
    prisma.indicador.findFirst.mockResolvedValue(null);
    prisma.indicador.create.mockResolvedValue({
      id: 'indicador-123',
      nome: 'Indicador de Teste',
      status: 'ATIVO',
      deletedAt: null,
      nucleoId: 'nucleo-123',
      programaId: 'programa-123',
    });
    prisma.indicadorRegistro.findFirst.mockResolvedValue(null);
    prisma.indicadorRegistro.create.mockResolvedValue({ id: 'registro-1' });

    const resultado = await service.importarCsv(
      'indicadores.csv',
      'nomeIndicador,nucleo,programa,ano,trimestre,valorRealizado\nIndicador de Teste,Núcleo Teste,Programa Teste,2025,Q1,42.5',
      'user-1',
      Role.ADMINISTRADOR,
    );

    expect(prisma.indicador.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nome: 'Indicador de Teste',
          escopo: 'NUCLEO',
          nucleoId: 'nucleo-123',
          programaId: 'programa-123',
          unidadeMedida: 'unidade',
        }),
      }),
    );

    expect(prisma.indicadorRegistro.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          indicadorId: 'indicador-123',
          ano: 2025,
          trimestre: 'Q1',
          valorRealizado: 42.5,
        }),
      }),
    );

    expect(resultado.status).toBe(StatusImportacao.CONCLUIDA);
  });

  it('deve criar indicador vinculado a núcleo e programa quando esses campos vierem em texto no CSV', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      perfil: Role.ADMINISTRADOR,
      nucleos: [],
    });

    prisma.importacao.create.mockResolvedValue({ id: 'importacao-1' });
    prisma.importacao.update.mockResolvedValue({
      id: 'importacao-1',
      status: StatusImportacao.CONCLUIDA,
    });

    prisma.nucleo.findFirst.mockResolvedValue({
      id: 'nucleo-555',
      nome: 'Núcleo de Educação',
      sigla: 'NE',
      status: 'ATIVO',
      deletedAt: null,
    });
    prisma.programa.findFirst.mockResolvedValue({
      id: 'programa-999',
      nome: 'Programa de Alfabetização',
      nucleoId: 'nucleo-555',
      status: 'ATIVO',
      deletedAt: null,
    });
    prisma.indicador.findFirst.mockResolvedValue(null);
    prisma.indicador.create.mockResolvedValue({
      id: 'indicador-456',
      nome: 'Indicador do Núcleo',
      status: 'ATIVO',
      deletedAt: null,
      nucleoId: 'nucleo-555',
      programaId: 'programa-999',
    });
    prisma.indicadorRegistro.findFirst.mockResolvedValue(null);
    prisma.indicadorRegistro.create.mockResolvedValue({ id: 'registro-1' });

    const resultado = await service.importarCsv(
      'indicadores.csv',
      'nucleo,programa,nomeIndicador,ano,trimestre,valorRealizado\nNúcleo de Educação,Programa de Alfabetização,Indicador do Núcleo,2025,Q1,42.5',
      'user-1',
      Role.ADMINISTRADOR,
    );

    expect(prisma.nucleo.findFirst).toHaveBeenCalled();
    expect(prisma.programa.findFirst).toHaveBeenCalled();
    expect(prisma.indicador.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nome: 'Indicador do Núcleo',
          nucleoId: 'nucleo-555',
          programaId: 'programa-999',
          escopo: 'NUCLEO',
        }),
      }),
    );

    expect(resultado.status).toBe(StatusImportacao.CONCLUIDA);
  });
});
