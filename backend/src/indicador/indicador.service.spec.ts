import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AcaoAuditoria,
  EscopoIndicador,
  Prisma,
  Role,
  StatusAprovacao,
  StatusRegistro,
  TrimestreEnum,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { IndicadorService } from './indicador.service';

describe('IndicadorService', () => {
  let service: IndicadorService;
  let prisma: {
    userNucleo: { findMany: jest.Mock };
    indicador: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    indicadorRegistro: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    meta: { updateMany: jest.Mock };
    nucleo: { findFirst: jest.Mock };
    programa: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { registrarAcao: jest.Mock };

  const admin = { id: 'admin-uuid', role: Role.ADMINISTRADOR };
  const diretor = { id: 'dn-uuid', role: Role.DIRETORES_NUCLEOS };
  const comunicacao = { id: 'ec-uuid', role: Role.EQUIPE_COMUNICACAO };
  const gestao = { id: 'eg-uuid', role: Role.EQUIPE_GESTAO };
  const dadosRegistro = {
    ano: 2026,
    trimestre: TrimestreEnum.Q1,
    valorRealizado: 10,
  };

  beforeEach(() => {
    prisma = {
      userNucleo: { findMany: jest.fn().mockResolvedValue([]) },
      indicador: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      indicadorRegistro: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUniqueOrThrow: jest.fn(),
      },
      meta: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      nucleo: { findFirst: jest.fn() },
      programa: { findFirst: jest.fn() },
      $transaction: jest.fn((operacoes: Promise<unknown>[]) =>
        Promise.all(operacoes),
      ),
    };
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    service = new IndicadorService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  const whereRegistros = () => {
    const [args] = prisma.indicador.findMany.mock.calls[0] as [
      {
        where: Record<string, unknown>;
        include: { registros: { where: object } };
      },
    ];
    return args;
  };

  describe('findAll', () => {
    it('Comunicação vê todos os núcleos, mas só registros aprovados ou publicados (RN01)', async () => {
      await service.findAll(comunicacao);

      const args = whereRegistros();
      expect(args.where).not.toHaveProperty('OR');
      expect(args.include.registros.where).toEqual(
        expect.objectContaining({
          statusAprovacao: {
            in: [StatusAprovacao.APROVADO, StatusAprovacao.PUBLICADO],
          },
        }),
      );
      expect(prisma.userNucleo.findMany).not.toHaveBeenCalled();
    });

    it('administração vê tudo, inclusive registros não aprovados', async () => {
      await service.findAll(admin);

      const args = whereRegistros();
      expect(args.where).not.toHaveProperty('OR');
      expect(args.include.registros.where).not.toHaveProperty(
        'statusAprovacao',
      );
    });

    it('demais perfis veem institucionais e os indicadores dos seus núcleos', async () => {
      prisma.userNucleo.findMany.mockResolvedValue([{ nucleoId: 'nei' }]);

      await service.findAll(gestao);

      expect(whereRegistros().where).toEqual(
        expect.objectContaining({
          OR: [
            { escopo: EscopoIndicador.INSTITUCIONAL },
            { nucleoId: { in: ['nei'] } },
          ],
        }),
      );
    });
  });

  describe('create', () => {
    it('cria e registra na auditoria', async () => {
      prisma.nucleo.findFirst.mockResolvedValue({ id: 'nei' });
      prisma.indicador.create.mockResolvedValue({
        id: 'ind-uuid',
        nome: 'Startups',
        escopo: EscopoIndicador.NUCLEO,
        nucleoId: 'nei',
        programaId: null,
      });

      await service.create(
        { nome: 'Startups', escopo: EscopoIndicador.NUCLEO, nucleoId: 'nei' },
        { id: admin.id, ip: '1.2.3.4' },
      );

      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.CRIAR,
          entidade: 'Indicador',
          entidadeId: 'ind-uuid',
        }),
      );
    });

    it('exige núcleo para escopo NUCLEO', async () => {
      await expect(
        service.create(
          { nome: 'X', escopo: EscopoIndicador.NUCLEO },
          { id: admin.id },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('atualiza indicador e remove metas ao passar semMeta: true', async () => {
      prisma.indicador.findFirst.mockResolvedValue({
        id: 'ind-uuid',
        nome: 'Indicador Teste',
        escopo: EscopoIndicador.INSTITUCIONAL,
        nucleoId: null,
        programaId: null,
      });
      prisma.indicador.update.mockResolvedValue({
        id: 'ind-uuid',
        nome: 'Indicador Teste',
        escopo: EscopoIndicador.INSTITUCIONAL,
        nucleoId: null,
        programaId: null,
        registros: [],
      });

      await service.update(
        'ind-uuid',
        { semMeta: true },
        { id: admin.id, ip: '127.0.0.1' },
      );

      expect(prisma.meta.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { indicadorId: 'ind-uuid', deletedAt: null },
          data: expect.objectContaining({ status: StatusRegistro.INATIVO }),
        }),
      );
      expect(prisma.indicadorRegistro.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { indicadorId: 'ind-uuid', deletedAt: null },
          data: { metaAplicada: null },
        }),
      );
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.ATUALIZAR,
          entidadeId: 'ind-uuid',
          dadosNovos: expect.objectContaining({ semMeta: true }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('exclui um único indicador com registros e metas e audita', async () => {
      prisma.indicador.findFirst.mockResolvedValue({
        id: 'ind-uuid',
        nome: 'Startups',
        status: 'ATIVO',
        nucleoId: 'nei',
      });
      prisma.indicadorRegistro.updateMany.mockResolvedValue({ count: 3 });
      prisma.meta.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.remove('ind-uuid', { id: admin.id }),
      ).resolves.toEqual({ message: 'Indicador excluído com sucesso.' });

      expect(prisma.indicadorRegistro.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { indicadorId: 'ind-uuid', deletedAt: null },
        }),
      );
      expect(prisma.indicador.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ind-uuid' } }),
      );
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.EXCLUIR_LOGICO,
          entidadeId: 'ind-uuid',
          dadosNovos: {
            excluido: true,
            registrosExcluidos: 3,
            metasExcluidas: 1,
          },
        }),
      );
    });

    it('retorna 404 para indicador inexistente ou já excluído', async () => {
      prisma.indicador.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('ind-uuid', { id: admin.id }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('salvarRegistro', () => {
    const indicadorNei = { id: 'ind-uuid', nucleoId: 'nei' };
    const registroExistente = (statusAprovacao: StatusAprovacao) => ({
      id: 'reg-uuid',
      valorRealizado: new Prisma.Decimal(5),
      statusAprovacao,
      status: StatusRegistro.ATIVO,
    });

    beforeEach(() => {
      prisma.indicador.findFirst.mockResolvedValue(indicadorNei);
      prisma.indicadorRegistro.create.mockImplementation(
        ({ data }: { data: { statusAprovacao: StatusAprovacao } }) => ({
          id: 'novo-reg',
          ...data,
        }),
      );
      // A alteração grava com updateMany (condicional) e relê o registro
      prisma.indicadorRegistro.updateMany.mockResolvedValue({ count: 1 });
      prisma.indicadorRegistro.findUniqueOrThrow.mockImplementation(() => {
        const [args] = prisma.indicadorRegistro.updateMany.mock.calls.at(
          -1,
        ) as [{ data: object }];
        return { id: 'reg-uuid', ...args.data };
      });
    });

    it('retorna 404 para indicador inexistente ou inativo', async () => {
      prisma.indicador.findFirst.mockResolvedValue(null);

      await expect(
        service.salvarRegistro('ind-uuid', dadosRegistro, admin),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('Direção de Núcleo não registra em indicador de outro núcleo', async () => {
      prisma.userNucleo.findMany.mockResolvedValue([{ nucleoId: 'ninter' }]);

      await expect(
        service.salvarRegistro('ind-uuid', dadosRegistro, diretor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.indicadorRegistro.create).not.toHaveBeenCalled();
    });

    it('Direção de Núcleo não registra em indicador institucional', async () => {
      prisma.indicador.findFirst.mockResolvedValue({
        id: 'ind-uuid',
        nucleoId: null,
      });
      prisma.userNucleo.findMany.mockResolvedValue([{ nucleoId: 'nei' }]);

      await expect(
        service.salvarRegistro('ind-uuid', dadosRegistro, diretor),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('cria registro do próprio núcleo em preenchimento e audita', async () => {
      prisma.userNucleo.findMany.mockResolvedValue([{ nucleoId: 'nei' }]);

      const registro = await service.salvarRegistro(
        'ind-uuid',
        dadosRegistro,
        diretor,
        '1.2.3.4',
      );

      expect(registro.statusAprovacao).toBe(StatusAprovacao.EM_PREENCHIMENTO);
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.CRIAR,
          entidade: 'IndicadorRegistro',
          userId: diretor.id,
        }),
      );
    });

    it.each([
      StatusAprovacao.ENVIADO_REVISAO,
      StatusAprovacao.APROVADO,
      StatusAprovacao.PUBLICADO,
    ])(
      'Direção de Núcleo não altera valor com status %s (RN02)',
      async (status) => {
        prisma.userNucleo.findMany.mockResolvedValue([{ nucleoId: 'nei' }]);
        prisma.indicadorRegistro.findFirst.mockResolvedValue(
          registroExistente(status),
        );

        await expect(
          service.salvarRegistro('ind-uuid', dadosRegistro, diretor),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(prisma.indicadorRegistro.updateMany).not.toHaveBeenCalled();
      },
    );

    it('Direção de Núcleo corrige valor devolvido e ele volta a preenchimento', async () => {
      prisma.userNucleo.findMany.mockResolvedValue([{ nucleoId: 'nei' }]);
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        registroExistente(StatusAprovacao.NECESSITA_CORRECAO),
      );

      const registro = await service.salvarRegistro(
        'ind-uuid',
        dadosRegistro,
        diretor,
      );

      expect(registro.statusAprovacao).toBe(StatusAprovacao.EM_PREENCHIMENTO);
    });

    it.each([StatusAprovacao.APROVADO, StatusAprovacao.PUBLICADO])(
      'admin alterando valor %s devolve para revisão e limpa a homologação (RN04)',
      async (status) => {
        prisma.indicadorRegistro.findFirst.mockResolvedValue(
          registroExistente(status),
        );

        await service.salvarRegistro('ind-uuid', dadosRegistro, admin);

        expect(prisma.indicadorRegistro.updateMany).toHaveBeenCalledWith({
          where: {
            id: 'reg-uuid',
            deletedAt: null,
            status: StatusRegistro.ATIVO,
            statusAprovacao: status,
          },
          data: expect.objectContaining({
            statusAprovacao: StatusAprovacao.ENVIADO_REVISAO,
            aprovadorId: null,
            revisadoEm: null,
            publicadoPorId: null,
            publicadoEm: null,
          }) as unknown,
        });
        expect(audit.registrarAcao).toHaveBeenCalledWith(
          expect.objectContaining({
            acao: AcaoAuditoria.ATUALIZAR,
            dadosAntigos: { valorRealizado: '5', statusAprovacao: status },
            dadosNovos: {
              valorRealizado: 10,
              statusAprovacao: StatusAprovacao.ENVIADO_REVISAO,
            },
          }),
        );
      },
    );

    it('não altera valor inativo, nem pelo administrador (RN06)', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue({
        ...registroExistente(StatusAprovacao.EM_PREENCHIMENTO),
        status: StatusRegistro.INATIVO,
      });

      await expect(
        service.salvarRegistro('ind-uuid', dadosRegistro, admin),
      ).rejects.toThrow('Este valor está inativo');
      expect(prisma.indicadorRegistro.updateMany).not.toHaveBeenCalled();
      expect(prisma.indicadorRegistro.create).not.toHaveBeenCalled();
    });

    it('não sobrescreve valor alterado por outra operação no meio tempo', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        registroExistente(StatusAprovacao.EM_PREENCHIMENTO),
      );
      prisma.indicadorRegistro.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.salvarRegistro('ind-uuid', dadosRegistro, admin),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });
  });
});
