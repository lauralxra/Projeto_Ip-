import {
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
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegistroService } from './registro.service';

const REG_ID = '9e4c3f5b-4a6d-4f8e-b12c-3d4e5f607182';
const autor = { id: 'admin-uuid', ip: '203.0.113.7' };
const admin = { id: 'admin-uuid', role: Role.ADMINISTRADOR };
const diretor = { id: 'dn-uuid', role: Role.DIRETORES_NUCLEOS };
const gestao = { id: 'eg-uuid', role: Role.EQUIPE_GESTAO };
const comunicacao = { id: 'ec-uuid', role: Role.EQUIPE_COMUNICACAO };

type Args = {
  where: Prisma.IndicadorRegistroWhereInput;
  data?: Record<string, unknown>;
  skip?: number;
  take?: number;
};
const argumento = (mock: jest.Mock, chamada = 0) =>
  (mock.mock.calls[chamada] as [Args])[0];

describe('RegistroService', () => {
  let service: RegistroService;
  let prisma: {
    userNucleo: { findMany: jest.Mock };
    indicadorRegistro: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
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
      indicadorRegistro: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ id: REG_ID }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((operacoes: Promise<unknown>[]) =>
        Promise.all(operacoes),
      ),
    };
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    service = new RegistroService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  const filtroDaListagem = () =>
    argumento(prisma.indicadorRegistro.findMany).where.AND as [
      Prisma.IndicadorRegistroWhereInput,
      Prisma.IndicadorRegistroWhereInput,
    ];

  describe('findAll', () => {
    const filtros = { pagina: 1, limite: 20 };

    it('administrador vê todos os registros não excluídos, paginados', async () => {
      // Sem filtro de status, a listagem traz só os ativos (também para o administrador)
      await expect(
        service.findAll({ pagina: 2, limite: 10 }, admin),
      ).resolves.toEqual({ itens: [], total: 0, pagina: 2, limite: 10 });

      expect(filtroDaListagem()[0]).toEqual({ deletedAt: null });
      expect(filtroDaListagem()[1]).toEqual({ status: StatusRegistro.ATIVO });
      expect(argumento(prisma.indicadorRegistro.findMany)).toMatchObject({
        skip: 10,
        take: 10,
      });
    });

    it.each([gestao, comunicacao])(
      '$role vê todos os núcleos, só valores homologados e ativos',
      async (usuario) => {
        await service.findAll(filtros, usuario);

        expect(filtroDaListagem()[0]).toEqual({
          deletedAt: null,
          status: StatusRegistro.ATIVO,
          statusAprovacao: {
            in: [StatusAprovacao.APROVADO, StatusAprovacao.PUBLICADO],
          },
          indicador: { deletedAt: null, status: StatusRegistro.ATIVO },
        });
      },
    );

    it('diretor vê os indicadores institucionais e os dos seus núcleos', async () => {
      await service.findAll(filtros, diretor);

      expect(filtroDaListagem()[0]).toEqual({
        deletedAt: null,
        status: StatusRegistro.ATIVO,
        indicador: {
          deletedAt: null,
          status: StatusRegistro.ATIVO,
          OR: [
            { escopo: EscopoIndicador.INSTITUCIONAL },
            { nucleoId: { in: ['nei'] } },
          ],
        },
      });
    });

    it('aplica os filtros de indicador, ano, trimestre e status de aprovação', async () => {
      await service.findAll(
        {
          ...filtros,
          indicadorId: 'ind-uuid',
          ano: 2026,
          trimestre: 'Q2',
          statusAprovacao: StatusAprovacao.APROVADO,
        },
        admin,
      );

      expect(filtroDaListagem()[1]).toEqual({
        indicadorId: 'ind-uuid',
        ano: 2026,
        trimestre: 'Q2',
        statusAprovacao: StatusAprovacao.APROVADO,
        status: StatusRegistro.ATIVO,
      });
    });

    it('só o administrador consulta registros inativos', async () => {
      await expect(
        service.findAll(
          { ...filtros, status: StatusRegistro.INATIVO },
          diretor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      await service.findAll(
        { ...filtros, status: StatusRegistro.INATIVO },
        admin,
      );
      expect(filtroDaListagem()[1]).toEqual({ status: StatusRegistro.INATIVO });
    });
  });

  describe('findOne', () => {
    it('responde 404 quando o registro está fora do alcance', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(null);

      await expect(service.findOne(REG_ID, diretor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existente = (
      statusAprovacao: StatusAprovacao,
      extra: Record<string, unknown> = {},
    ) => ({
      id: REG_ID,
      valorRealizado: new Prisma.Decimal(5),
      statusAprovacao,
      status: StatusRegistro.ATIVO,
      indicador: {
        nucleoId: 'nei',
        deletedAt: null,
        status: StatusRegistro.ATIVO,
      },
      ...extra,
    });

    it('diretor altera valor em preenchimento do próprio núcleo', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        existente(StatusAprovacao.NECESSITA_CORRECAO),
      );

      await service.update(REG_ID, { valorRealizado: 12 }, diretor, '1.2.3.4');

      expect(argumento(prisma.indicadorRegistro.updateMany)).toMatchObject({
        where: {
          id: REG_ID,
          deletedAt: null,
          status: StatusRegistro.ATIVO,
          statusAprovacao: StatusAprovacao.NECESSITA_CORRECAO,
        },
        data: {
          valorRealizado: 12,
          statusAprovacao: StatusAprovacao.EM_PREENCHIMENTO,
        },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.ATUALIZAR,
          dadosAntigos: {
            valorRealizado: '5',
            statusAprovacao: StatusAprovacao.NECESSITA_CORRECAO,
          },
        }),
      );
    });

    it('diretor não altera registro de outro núcleo', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        existente(StatusAprovacao.EM_PREENCHIMENTO, {
          indicador: {
            nucleoId: 'ninter',
            deletedAt: null,
            status: StatusRegistro.ATIVO,
          },
        }),
      );

      await expect(
        service.update(REG_ID, { valorRealizado: 1 }, diretor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.indicadorRegistro.updateMany).not.toHaveBeenCalled();
    });

    it('diretor não altera valor já enviado para revisão (RN02)', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        existente(StatusAprovacao.ENVIADO_REVISAO),
      );

      await expect(
        service.update(REG_ID, { valorRealizado: 1 }, diretor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('administrador alterando valor aprovado devolve para revisão (RN04)', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        existente(StatusAprovacao.APROVADO),
      );

      await service.update(REG_ID, { valorRealizado: 7 }, admin);

      expect(argumento(prisma.indicadorRegistro.updateMany).data).toMatchObject(
        {
          statusAprovacao: StatusAprovacao.ENVIADO_REVISAO,
          aprovadorId: null,
          publicadoEm: null,
        },
      );
    });

    it('não altera valor inativo (RN06)', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        existente(StatusAprovacao.EM_PREENCHIMENTO, {
          status: StatusRegistro.INATIVO,
        }),
      );

      await expect(
        service.update(REG_ID, { valorRealizado: 1 }, admin),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.indicadorRegistro.updateMany).not.toHaveBeenCalled();
    });

    it('não altera valor de indicador inativo', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        existente(StatusAprovacao.EM_PREENCHIMENTO, {
          indicador: {
            nucleoId: 'nei',
            deletedAt: null,
            status: StatusRegistro.INATIVO,
          },
        }),
      );

      await expect(
        service.update(REG_ID, { valorRealizado: 1 }, admin),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('não sobrescreve se o registro mudou no meio tempo e não audita', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        existente(StatusAprovacao.EM_PREENCHIMENTO),
      );
      prisma.indicadorRegistro.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(REG_ID, { valorRealizado: 1 }, diretor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('responde 404 para registro excluído', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(null);

      await expect(
        service.update(REG_ID, { valorRealizado: 1 }, admin),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('inativar e reativar', () => {
    it('inativa só registro ativo e audita', async () => {
      await service.inativar(REG_ID, autor);

      expect(argumento(prisma.indicadorRegistro.updateMany)).toEqual({
        where: { id: REG_ID, deletedAt: null, status: StatusRegistro.ATIVO },
        data: { status: StatusRegistro.INATIVO },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({ acao: AcaoAuditoria.DESATIVAR }),
      );
    });

    it('inativar registro já inativo responde 409 sem auditar', async () => {
      prisma.indicadorRegistro.updateMany.mockResolvedValue({ count: 0 });
      prisma.indicadorRegistro.findFirst.mockResolvedValue({ id: REG_ID });

      await expect(service.inativar(REG_ID, autor)).rejects.toThrow(
        'O registro já está inativo.',
      );
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('inativar registro inexistente responde 404', async () => {
      prisma.indicadorRegistro.updateMany.mockResolvedValue({ count: 0 });
      prisma.indicadorRegistro.findFirst.mockResolvedValue(null);

      await expect(service.inativar(REG_ID, autor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('reativa registro inativo', async () => {
      await service.reativar(REG_ID, autor);

      expect(argumento(prisma.indicadorRegistro.updateMany)).toEqual({
        where: { id: REG_ID, deletedAt: null, status: StatusRegistro.INATIVO },
        data: { status: StatusRegistro.ATIVO },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({ acao: AcaoAuditoria.RESTAURAR }),
      );
    });
  });

  describe('remove', () => {
    it('exclui logicamente e audita os dados do registro', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue({
        indicadorId: 'ind-uuid',
        ano: 2026,
        trimestre: 'Q1',
        valorRealizado: new Prisma.Decimal(5),
        statusAprovacao: StatusAprovacao.APROVADO,
        status: StatusRegistro.ATIVO,
      });

      await service.remove(REG_ID, autor);

      expect(argumento(prisma.indicadorRegistro.updateMany).where).toEqual({
        id: REG_ID,
        deletedAt: null,
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.EXCLUIR_LOGICO,
          dadosAntigos: expect.objectContaining({
            valorRealizado: '5',
          }) as unknown,
        }),
      );
    });

    it('não audita duas vezes quando outra requisição já excluiu', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue({
        valorRealizado: null,
      });
      prisma.indicadorRegistro.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(REG_ID, autor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });
  });
});

describe('RegistroService — fluxo de aprovação', () => {
  let service: RegistroService;
  let prisma: {
    userNucleo: { findMany: jest.Mock };
    indicadorRegistro: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
  };
  let audit: { registrarAcao: jest.Mock };

  const indicadorAtivo = { deletedAt: null, status: StatusRegistro.ATIVO };
  // Leitura feita por transicionar: etapa atual do valor e situação do indicador
  const naEtapa = (
    statusAprovacao: StatusAprovacao,
    indicador: {
      deletedAt: Date | null;
      status: StatusRegistro;
    } = indicadorAtivo,
  ) => ({ statusAprovacao, indicador });

  beforeEach(() => {
    prisma = {
      userNucleo: {
        findMany: jest.fn().mockResolvedValue([{ nucleoId: 'nei' }]),
      },
      indicadorRegistro: {
        findFirst: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: REG_ID }),
      },
    };
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    service = new RegistroService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  describe('enviarParaRevisao', () => {
    const preenchido = (nucleoId: string | null = 'nei') => ({
      valorRealizado: new Prisma.Decimal(10),
      indicador: { nucleoId, deletedAt: null },
    });

    it('diretor envia valor do próprio núcleo e registra o envio', async () => {
      prisma.indicadorRegistro.findFirst
        .mockResolvedValueOnce(preenchido())
        .mockResolvedValueOnce(naEtapa(StatusAprovacao.EM_PREENCHIMENTO));

      await service.enviarParaRevisao(REG_ID, diretor, '1.2.3.4');

      expect(argumento(prisma.indicadorRegistro.updateMany)).toMatchObject({
        where: { statusAprovacao: StatusAprovacao.EM_PREENCHIMENTO },
        data: {
          statusAprovacao: StatusAprovacao.ENVIADO_REVISAO,
          enviadoEm: expect.any(Date) as unknown,
        },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosAntigos: { statusAprovacao: StatusAprovacao.EM_PREENCHIMENTO },
        }),
      );
    });

    it.each(['ninter', null])(
      'diretor não envia valor de indicador do núcleo %s',
      async (nucleoId) => {
        prisma.indicadorRegistro.findFirst.mockResolvedValueOnce(
          preenchido(nucleoId),
        );

        await expect(
          service.enviarParaRevisao(REG_ID, diretor),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(prisma.indicadorRegistro.updateMany).not.toHaveBeenCalled();
      },
    );

    it('não envia valor vazio', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValueOnce({
        ...preenchido(),
        valorRealizado: null,
      });

      await expect(
        service.enviarParaRevisao(REG_ID, admin),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('transições da Administração', () => {
    it('aprova valor enviado para revisão, gravando quem aprovou', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        naEtapa(StatusAprovacao.ENVIADO_REVISAO),
      );

      await service.aprovar(REG_ID, autor);

      expect(argumento(prisma.indicadorRegistro.updateMany)).toMatchObject({
        where: {
          id: REG_ID,
          status: StatusRegistro.ATIVO,
          statusAprovacao: StatusAprovacao.ENVIADO_REVISAO,
        },
        data: {
          statusAprovacao: StatusAprovacao.APROVADO,
          aprovadorId: autor.id,
        },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({ acao: AcaoAuditoria.APROVAR }),
      );
    });

    it('devolve com justificativa', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        naEtapa(StatusAprovacao.ENVIADO_REVISAO),
      );

      await service.devolverComComentario(REG_ID, 'Valor divergente', autor);

      expect(argumento(prisma.indicadorRegistro.updateMany).data).toEqual({
        justificativaDevolucao: 'Valor divergente',
        statusAprovacao: StatusAprovacao.NECESSITA_CORRECAO,
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({ acao: AcaoAuditoria.DEVOLVER }),
      );
    });

    it('publica valor aprovado', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        naEtapa(StatusAprovacao.APROVADO),
      );

      await service.publicar(REG_ID, autor);

      expect(argumento(prisma.indicadorRegistro.updateMany).data).toMatchObject(
        { statusAprovacao: StatusAprovacao.PUBLICADO },
      );
    });

    it.each([
      ['aprovar', StatusAprovacao.EM_PREENCHIMENTO],
      ['aprovar', StatusAprovacao.APROVADO],
      ['publicar', StatusAprovacao.ENVIADO_REVISAO],
    ] as const)(
      '%s a partir de %s é recusado sem gravar',
      async (acao, etapa) => {
        prisma.indicadorRegistro.findFirst.mockResolvedValue(naEtapa(etapa));

        await expect(service[acao](REG_ID, autor)).rejects.toBeInstanceOf(
          ConflictException,
        );
        expect(prisma.indicadorRegistro.updateMany).not.toHaveBeenCalled();
        expect(audit.registrarAcao).not.toHaveBeenCalled();
      },
    );

    it('não revisa valor de indicador inativo', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        naEtapa(StatusAprovacao.ENVIADO_REVISAO, {
          deletedAt: null,
          status: StatusRegistro.INATIVO,
        }),
      );

      await expect(service.aprovar(REG_ID, autor)).rejects.toThrow(
        'Não é possível revisar valores de um indicador inativo.',
      );
      expect(prisma.indicadorRegistro.updateMany).not.toHaveBeenCalled();
    });

    it('responde 404 para valor inexistente ou de indicador excluído', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValueOnce(null);
      await expect(service.aprovar(REG_ID, autor)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      prisma.indicadorRegistro.findFirst.mockResolvedValueOnce(
        naEtapa(StatusAprovacao.ENVIADO_REVISAO, {
          deletedAt: new Date(),
          status: StatusRegistro.INATIVO,
        }),
      );
      await expect(service.aprovar(REG_ID, autor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('não grava nem audita se outra revisão mudou o valor no meio tempo', async () => {
      prisma.indicadorRegistro.findFirst.mockResolvedValue(
        naEtapa(StatusAprovacao.ENVIADO_REVISAO),
      );
      prisma.indicadorRegistro.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.aprovar(REG_ID, autor)).rejects.toThrow(
        'O registro foi alterado por outra operação.',
      );
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });
  });
});
