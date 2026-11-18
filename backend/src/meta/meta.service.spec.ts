import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  AcaoAuditoria,
  EscopoIndicador,
  Prisma,
  Role,
  StatusAprovacao,
  StatusRegistro,
  TipoDadoIndicador,
  TrimestreEnum,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetaService } from './meta.service';
import type { AuthenticatedUser } from '../auth/interface/request.interface';

const META_ID = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const IND_ID = '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e';
const autor = { id: 'admin-uuid', ip: '203.0.113.7' };
const admin: AuthenticatedUser = { id: 'admin-uuid', role: Role.ADMINISTRADOR };
const diretor: AuthenticatedUser = {
  id: 'dn-uuid',
  role: Role.DIRETORES_NUCLEOS,
};
const gestao: AuthenticatedUser = { id: 'eg-uuid', role: Role.EQUIPE_GESTAO };

type Args = { where: Record<string, unknown>; data?: Record<string, unknown> };
const argumento = (mock: jest.Mock, chamada = 0) =>
  (mock.mock.calls[chamada] as [Args])[0];

const meta = (
  trimestre: TrimestreEnum | null,
  tipoDado: TipoDadoIndicador = TipoDadoIndicador.NUMERICO,
  valorMeta = 100,
) => ({
  id: META_ID,
  indicadorId: IND_ID,
  ano: 2026,
  trimestre,
  valorMeta: new Prisma.Decimal(valorMeta),
  descricao: null,
  status: StatusRegistro.ATIVO,
  indicador: { id: IND_ID, tipoDado, nucleoId: 'nei' },
});

const registro = (
  trimestre: TrimestreEnum,
  valor: number | null,
  statusAprovacao: StatusAprovacao = StatusAprovacao.APROVADO,
) => ({
  indicadorId: IND_ID,
  ano: 2026,
  trimestre,
  valorRealizado: valor === null ? null : new Prisma.Decimal(valor),
  statusAprovacao,
});

describe('MetaService', () => {
  let service: MetaService;
  let prisma: {
    userNucleo: { findMany: jest.Mock };
    indicador: { findFirst: jest.Mock };
    indicadorRegistro: { findMany: jest.Mock };
    meta: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let audit: { registrarAcao: jest.Mock };

  beforeEach(() => {
    prisma = {
      userNucleo: {
        findMany: jest.fn().mockResolvedValue([{ nucleoId: 'nei' }]),
      },
      indicador: {
        findFirst: jest.fn().mockResolvedValue({
          id: IND_ID,
          tipoDado: TipoDadoIndicador.NUMERICO,
        }),
      },
      indicadorRegistro: { findMany: jest.fn().mockResolvedValue([]) },
      meta: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((operacoes: Promise<unknown>[]) =>
        Promise.all(operacoes),
      ),
    };
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    service = new MetaService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  describe('realizado x meta (comparação)', () => {
    const listar = async (
      metas: ReturnType<typeof meta>[],
      registros: ReturnType<typeof registro>[],
      usuario = admin,
    ) => {
      prisma.meta.findMany.mockResolvedValue(metas);
      prisma.indicadorRegistro.findMany.mockResolvedValue(registros);
      const { itens } = await service.findAll(
        { pagina: 1, limite: 20 },
        usuario,
      );
      return itens;
    };

    it('meta anual de indicador numérico soma o ano', async () => {
      const [resultado] = await listar(
        [meta(null)],
        [registro('Q1', 30), registro('Q2', 40), registro('Q3', null)],
      );

      expect(resultado).toMatchObject({
        valorMeta: 100,
        valorRealizado: 70,
        percentualAtingido: 70,
        statusAprovacaoRealizado: null,
        trimestresConsiderados: ['Q1', 'Q2', 'Q3'],
      });
    });

    it('meta anual de indicador percentual usa a última medição', async () => {
      const [resultado] = await listar(
        [meta(null, TipoDadoIndicador.PERCENTUAL, 80)],
        [registro('Q1', 50), registro('Q2', 60)],
      );

      expect(resultado).toMatchObject({
        valorRealizado: 60,
        percentualAtingido: 75,
      });
    });

    it('meta trimestral usa só o trimestre e traz o status do valor', async () => {
      const [resultado] = await listar(
        [meta('Q2')],
        [
          registro('Q1', 30),
          registro('Q2', 45, StatusAprovacao.ENVIADO_REVISAO),
        ],
      );

      expect(resultado).toMatchObject({
        valorRealizado: 45,
        percentualAtingido: 45,
        statusAprovacaoRealizado: StatusAprovacao.ENVIADO_REVISAO,
      });
    });

    it('sem medição o realizado e o percentual ficam nulos', async () => {
      const [resultado] = await listar([meta('Q4')], [registro('Q1', 30)]);

      expect(resultado).toMatchObject({
        valorRealizado: null,
        percentualAtingido: null,
      });
    });

    it('considera só valores ativos e, para a gestão, só os homologados', async () => {
      await listar([meta(null)], [], gestao);

      expect(argumento(prisma.indicadorRegistro.findMany).where).toMatchObject({
        deletedAt: null,
        status: StatusRegistro.ATIVO,
        statusAprovacao: {
          in: [StatusAprovacao.APROVADO, StatusAprovacao.PUBLICADO],
        },
      });
    });

    it('diretor vê o realizado em qualquer status', async () => {
      await listar([meta(null)], [], diretor);

      expect(
        argumento(prisma.indicadorRegistro.findMany).where,
      ).not.toHaveProperty('statusAprovacao');
    });
  });

  describe('findAll', () => {
    const filtroDaListagem = () =>
      argumento(prisma.meta.findMany).where.AND as Record<string, unknown>[];

    it('gestão vê metas ativas de indicadores ativos de todos os núcleos', async () => {
      await service.findAll({ pagina: 1, limite: 20 }, gestao);

      expect(filtroDaListagem()[0]).toEqual({
        deletedAt: null,
        status: StatusRegistro.ATIVO,
        indicador: { deletedAt: null, status: StatusRegistro.ATIVO },
      });
    });

    it('diretor vê os indicadores institucionais e os dos seus núcleos', async () => {
      await service.findAll({ pagina: 1, limite: 20 }, diretor);

      expect(filtroDaListagem()[0]).toMatchObject({
        indicador: {
          OR: [
            { escopo: EscopoIndicador.INSTITUCIONAL },
            { nucleoId: { in: ['nei'] } },
          ],
        },
      });
    });

    it('aplica filtros e paginação', async () => {
      await expect(
        service.findAll(
          {
            pagina: 2,
            limite: 10,
            indicadorId: IND_ID,
            nucleoId: 'nucleo-uuid',
            ano: 2026,
            anual: true,
          },
          admin,
        ),
      ).resolves.toMatchObject({ total: 0, pagina: 2, limite: 10 });

      expect(filtroDaListagem()[1]).toEqual({
        indicadorId: IND_ID,
        indicador: { nucleoId: 'nucleo-uuid' },
        ano: 2026,
        trimestre: null,
      });
      expect(argumento(prisma.meta.findMany)).toMatchObject({
        skip: 10,
        take: 10,
      });
    });
  });

  describe('create', () => {
    const dados = { indicadorId: IND_ID, ano: 2026, valorMeta: 120 };

    it('cria a meta anual e audita', async () => {
      prisma.meta.create.mockResolvedValue(meta(null, undefined, 120));

      await service.create(dados, autor);

      expect(argumento(prisma.meta.create).data).toMatchObject({
        trimestre: null,
        valorMeta: 120,
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.CRIAR,
          entidade: 'Meta',
        }),
      );
    });

    it('recusa meta duplicada no mesmo período', async () => {
      prisma.meta.findFirst.mockResolvedValue({ id: 'outra' });

      await expect(service.create(dados, autor)).rejects.toThrow(
        'Já existe uma meta anual para este indicador em 2026.',
      );
      expect(prisma.meta.create).not.toHaveBeenCalled();
    });

    it('requisição simultânea barrada pelo índice único vira 409 com mensagem clara', async () => {
      prisma.meta.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'teste',
        }),
      );

      await expect(
        service.create({ ...dados, trimestre: 'Q3' }, autor),
      ).rejects.toThrow('Já existe uma meta para este indicador em Q3/2026.');
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('recusa meta acima de 100 em indicador percentual', async () => {
      prisma.indicador.findFirst.mockResolvedValue({
        id: IND_ID,
        tipoDado: TipoDadoIndicador.PERCENTUAL,
      });

      await expect(
        service.create({ ...dados, valorMeta: 150 }, autor),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('recusa indicador inexistente ou inativo', async () => {
      prisma.indicador.findFirst.mockResolvedValue(null);

      await expect(service.create(dados, autor)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.meta.findFirst.mockResolvedValue({
        valorMeta: new Prisma.Decimal(100),
        descricao: null,
        indicador: { tipoDado: TipoDadoIndicador.NUMERICO },
      });
      prisma.meta.findUniqueOrThrow.mockResolvedValue(
        meta(null, undefined, 150),
      );
    });

    it('altera só se a meta não foi excluída e audita antes e depois', async () => {
      await service.update(META_ID, { valorMeta: 150 }, autor);

      expect(argumento(prisma.meta.updateMany)).toEqual({
        where: { id: META_ID, deletedAt: null },
        data: { valorMeta: 150 },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.ATUALIZAR,
          dadosAntigos: { valorMeta: '100', descricao: null },
          dadosNovos: { valorMeta: '150', descricao: null },
        }),
      );
    });

    it('responde 404 se a meta foi excluída no meio tempo, sem auditar', async () => {
      prisma.meta.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(META_ID, { valorMeta: 150 }, autor),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('recusa atualização vazia', async () => {
      await expect(service.update(META_ID, {}, autor)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('não exclui nem audita duas vezes', async () => {
      prisma.meta.findFirst.mockResolvedValue({
        indicadorId: IND_ID,
        ano: 2026,
        trimestre: null,
        valorMeta: new Prisma.Decimal(100),
        status: StatusRegistro.ATIVO,
      });
      prisma.meta.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(META_ID, autor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('exclui logicamente e audita', async () => {
      prisma.meta.findFirst.mockResolvedValue({
        indicadorId: IND_ID,
        ano: 2026,
        trimestre: null,
        valorMeta: new Prisma.Decimal(100),
        status: StatusRegistro.ATIVO,
      });

      await service.remove(META_ID, autor);

      expect(argumento(prisma.meta.updateMany).where).toEqual({
        id: META_ID,
        deletedAt: null,
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({ acao: AcaoAuditoria.EXCLUIR_LOGICO }),
      );
    });
  });

  it('responde 409 com ConflictException para duplicata (tipo do erro)', async () => {
    prisma.meta.findFirst.mockResolvedValue({ id: 'outra' });

    await expect(
      service.create({ indicadorId: IND_ID, ano: 2026, valorMeta: 1 }, autor),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
