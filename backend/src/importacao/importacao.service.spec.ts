import {
  AcaoAuditoria,
  Role,
  StatusAprovacao,
  StatusImportacao,
} from '@prisma/client';
import { ImportacaoService, normalizarCabecalho } from './importacao.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const CABECALHO = 'nomeIndicador,nucleo,programa,ano,trimestre,valorRealizado';

const nucleo = { id: 'nucleo-1', nome: 'NEI', sigla: 'NEI', status: 'ATIVO' };
const programa = {
  id: 'programa-1',
  nome: 'Aceleração',
  nucleoId: 'nucleo-1',
  status: 'ATIVO',
};
const indicador = {
  id: 'indicador-1',
  nome: 'Startups Aceleradas',
  nucleoId: 'nucleo-1',
  programaId: 'programa-1',
  status: 'ATIVO',
};
const registroEm = (statusAprovacao: StatusAprovacao, status = 'ATIVO') => ({
  id: 'registro-1',
  valorRealizado: null,
  statusAprovacao,
  status,
});

describe('ImportacaoService', () => {
  let service: ImportacaoService;
  let prisma: {
    user: { findFirst: jest.Mock };
    importacao: { create: jest.Mock; update: jest.Mock };
    nucleo: { findFirst: jest.Mock };
    programa: { findFirst: jest.Mock };
    indicador: { findFirst: jest.Mock; create: jest.Mock };
    indicadorRegistro: {
      findFirst: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
    };
    meta: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };
  let audit: { registrarAcao: jest.Mock };

  const usuario = (perfil: Role, nucleoIds: string[] = []) =>
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      perfil,
      nucleos: nucleoIds.map((nucleoId) => ({ nucleoId })),
    });

  const importar = (csv: string, role: Role = Role.ADMINISTRADOR) =>
    service.importarCsv('indicadores.csv', csv, 'user-1', role);

  // O resultado devolvido é o que foi gravado em importacao.update
  const resultado = () =>
    (
      prisma.importacao.update.mock.calls[0] as [
        {
          data: {
            status: StatusImportacao;
            linhasOk: number;
            erros: { linha: number; mensagem: string }[];
          };
        },
      ]
    )[0].data;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn() },
      importacao: {
        create: jest.fn().mockResolvedValue({ id: 'importacao-1' }),
        update: jest.fn().mockResolvedValue({ id: 'importacao-1' }),
      },
      nucleo: { findFirst: jest.fn().mockResolvedValue(nucleo) },
      programa: { findFirst: jest.fn().mockResolvedValue(programa) },
      indicador: {
        findFirst: jest.fn().mockResolvedValue(indicador),
        create: jest.fn(),
      },
      indicadorRegistro: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'registro-novo',
          statusAprovacao: StatusAprovacao.EM_PREENCHIMENTO,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      meta: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    usuario(Role.ADMINISTRADOR);

    service = new ImportacaoService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  it('exige núcleo e programa no cabeçalho', async () => {
    await expect(
      importar(
        'nomeIndicador,ano,trimestre,valorRealizado\nIndicador,2025,Q1,42.5',
      ),
    ).rejects.toThrow('Cabeçalho obrigatório: deve conter nucleo e programa');
  });

  describe('cabeçalho com acento', () => {
    it('normaliza acentos, maiúsculas, espaços e "_"', () => {
      expect(normalizarCabecalho('Núcleo')).toBe('nucleo');
      expect(normalizarCabecalho('Período')).toBe('periodo');
      expect(normalizarCabecalho('Valor Realizado')).toBe('valorrealizado');
      expect(normalizarCabecalho('Código_do_Indicador')).toBe(
        'codigodoindicador',
      );
    });

    it('aceita "Núcleo", "Período" e "Valor Realizado" como colunas', async () => {
      await importar(
        'Nome Indicador;Núcleo;Programa;Ano;Período;Valor Realizado\n' +
          'Startups Aceleradas;NEI;Aceleração;2025;Q1;42,5',
      );

      expect(prisma.indicadorRegistro.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          indicadorId: 'indicador-1',
          ano: 2025,
          trimestre: 'Q1',
          valorRealizado: 42.5,
        }) as unknown,
      });
      expect(resultado().status).toBe(StatusImportacao.CONCLUIDA);
    });
  });

  describe('indicador inexistente', () => {
    it('rejeita a linha e nunca cria indicador', async () => {
      prisma.indicador.findFirst.mockResolvedValue(null);

      await importar(
        `${CABECALHO}\nIndicador Digitado Errado,NEI,Aceleração,2025,Q1,10`,
      );

      expect(prisma.indicador.create).not.toHaveBeenCalled();
      expect(prisma.indicadorRegistro.create).not.toHaveBeenCalled();
      expect(resultado()).toEqual(
        expect.objectContaining({
          status: StatusImportacao.FALHA,
          linhasOk: 0,
          erros: [
            {
              linha: 2,
              mensagem: 'Indicador não encontrado: Indicador Digitado Errado',
            },
          ],
        }),
      );
    });

    it('busca pelo nome só dentro do núcleo e do programa informados', async () => {
      await importar(
        `${CABECALHO}\nStartups Aceleradas,NEI,Aceleração,2025,Q1,10`,
      );

      expect(prisma.indicador.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          nome: { equals: 'Startups Aceleradas', mode: 'insensitive' },
          nucleoId: 'nucleo-1',
          programaId: 'programa-1',
        }) as unknown,
      });
    });
  });

  describe('gravação e auditoria', () => {
    it('cria o registro em preenchimento e audita a criação', async () => {
      await importar(
        `${CABECALHO}\nStartups Aceleradas,NEI,Aceleração,2025,Q1,10`,
      );

      expect(prisma.indicadorRegistro.create).toHaveBeenCalledWith({
        data: {
          indicadorId: 'indicador-1',
          ano: 2025,
          trimestre: 'Q1',
          valorRealizado: 10,
          statusAprovacao: StatusAprovacao.EM_PREENCHIMENTO,
          responsavelId: 'user-1',
          importacaoId: 'importacao-1',
        },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith({
        userId: 'user-1',
        acao: AcaoAuditoria.CRIAR,
        entidade: 'IndicadorRegistro',
        entidadeId: 'registro-novo',
        dadosNovos: {
          indicadorId: 'indicador-1',
          ano: 2025,
          trimestre: 'Q1',
          valorRealizado: 10,
          statusAprovacao: StatusAprovacao.EM_PREENCHIMENTO,
          importacaoId: 'importacao-1',
        },
      });
    });

    it('altera registro editável pelo fluxo de alterarValorRegistro e audita', async () => {
      usuario(Role.DIRETORES_NUCLEOS, ['nucleo-1']);
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        registroEm(StatusAprovacao.EM_PREENCHIMENTO),
      );

      await importar(
        `${CABECALHO}\nStartups Aceleradas,NEI,Aceleração,2025,Q1,10`,
        Role.DIRETORES_NUCLEOS,
      );

      expect(prisma.indicadorRegistro.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: 'registro-1',
          statusAprovacao: StatusAprovacao.EM_PREENCHIMENTO,
        }) as unknown,
        data: expect.objectContaining({
          valorRealizado: 10,
          importacaoId: 'importacao-1',
          statusAprovacao: StatusAprovacao.EM_PREENCHIMENTO,
        }) as unknown,
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.ATUALIZAR,
          entidade: 'IndicadorRegistro',
          entidadeId: 'registro-1',
          dadosNovos: expect.objectContaining({
            importacaoId: 'importacao-1',
          }) as unknown,
        }),
      );
      expect(resultado().status).toBe(StatusImportacao.CONCLUIDA);
    });
  });

  describe('registro em análise', () => {
    it.each([
      StatusAprovacao.ENVIADO_REVISAO,
      StatusAprovacao.APROVADO,
      StatusAprovacao.PUBLICADO,
    ])(
      'bloqueia a linha do Diretor quando o registro está %s',
      async (statusAprovacao) => {
        usuario(Role.DIRETORES_NUCLEOS, ['nucleo-1']);
        prisma.indicadorRegistro.findFirst.mockResolvedValue(
          registroEm(statusAprovacao),
        );

        await importar(
          'nomeIndicador,nucleo,programa,ano,trimestre,valorRealizado,meta\n' +
            'Startups Aceleradas,NEI,Aceleração,2025,Q1,10,20',
          Role.DIRETORES_NUCLEOS,
        );

        expect(prisma.indicadorRegistro.updateMany).not.toHaveBeenCalled();
        expect(prisma.meta.create).not.toHaveBeenCalled();
        expect(audit.registrarAcao).not.toHaveBeenCalled();
        expect(resultado().erros).toEqual([
          {
            linha: 2,
            mensagem: `Indicador Startups Aceleradas está com status ${statusAprovacao} e não pode ser alterado via importação.`,
          },
        ]);
      },
    );

    it('bloqueia registro inativo até para o administrador', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        registroEm(StatusAprovacao.EM_PREENCHIMENTO, 'INATIVO'),
      );

      await importar(
        `${CABECALHO}\nStartups Aceleradas,NEI,Aceleração,2025,Q1,10`,
      );

      expect(prisma.indicadorRegistro.updateMany).not.toHaveBeenCalled();
      expect(resultado().erros[0].mensagem).toBe(
        'Indicador Startups Aceleradas está com status INATIVO e não pode ser alterado via importação.',
      );
    });

    it('administrador altera valor aprovado e o registro volta para revisão (RN04)', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        registroEm(StatusAprovacao.APROVADO),
      );

      await importar(
        `${CABECALHO}\nStartups Aceleradas,NEI,Aceleração,2025,Q1,10`,
      );

      expect(prisma.indicadorRegistro.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusAprovacao: StatusAprovacao.ENVIADO_REVISAO,
            aprovadorId: null,
          }) as unknown,
        }),
      );
    });
  });

  describe('permissão por núcleo', () => {
    it('rejeita núcleo de outro usuário antes de buscar indicador ou gravar', async () => {
      usuario(Role.DIRETORES_NUCLEOS, ['outro-nucleo']);

      await importar(
        `${CABECALHO}\nStartups Aceleradas,NEI,Aceleração,2025,Q1,10`,
        Role.DIRETORES_NUCLEOS,
      );

      expect(prisma.programa.findFirst).not.toHaveBeenCalled();
      expect(prisma.indicador.findFirst).not.toHaveBeenCalled();
      expect(prisma.indicador.create).not.toHaveBeenCalled();
      expect(prisma.indicadorRegistro.create).not.toHaveBeenCalled();
      expect(prisma.indicadorRegistro.updateMany).not.toHaveBeenCalled();
      expect(prisma.meta.create).not.toHaveBeenCalled();
      expect(resultado().erros).toEqual([
        { linha: 2, mensagem: 'Sem permissão para este núcleo.' },
      ]);
    });

    it.each([
      ['de outro núcleo', 'outro-nucleo'],
      ['institucional', null],
    ])(
      'rejeita indicador buscado por id que é %s',
      async (_descricao, nucleoId) => {
        usuario(Role.EQUIPE_GESTAO, ['nucleo-1']);
        prisma.indicador.findFirst.mockResolvedValue({
          ...indicador,
          nucleoId,
        });

        await importar(
          'indicadorId,nucleo,programa,ano,trimestre,valorRealizado\n' +
            'indicador-1,NEI,Aceleração,2025,Q1,10',
          Role.EQUIPE_GESTAO,
        );

        expect(prisma.indicadorRegistro.findFirst).not.toHaveBeenCalled();
        expect(prisma.indicadorRegistro.create).not.toHaveBeenCalled();
        expect(resultado().erros[0].mensagem).toBe(
          'Sem permissão para este núcleo.',
        );
      },
    );

    it('nucleoId inexistente é rejeitado em vez de ignorado', async () => {
      prisma.nucleo.findFirst.mockResolvedValue(null);

      await importar(
        'nomeIndicador,nucleoId,programa,ano,trimestre,valorRealizado\n' +
          'Startups Aceleradas,id-que-nao-existe,Aceleração,2025,Q1,10',
      );

      expect(prisma.indicadorRegistro.create).not.toHaveBeenCalled();
      expect(resultado().erros[0].mensagem).toMatch(/Núcleo não encontrado/);
    });
  });

  it('importa vários trimestres do mesmo indicador', async () => {
    await importar(
      `${CABECALHO}\n` +
        'Startups Aceleradas,NEI,Aceleração,2024,Q1,10\n' +
        'Startups Aceleradas,NEI,Aceleração,2024,Q2,20\n' +
        'Startups Aceleradas,NEI,Aceleração,2024,Q3,30',
    );

    expect(prisma.indicadorRegistro.create).toHaveBeenCalledTimes(3);
    expect(resultado()).toEqual(
      expect.objectContaining({
        status: StatusImportacao.CONCLUIDA,
        linhasOk: 3,
      }),
    );
  });
});
