import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AcaoAuditoria, Role, StatusRegistro } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProgramaService } from './programa.service';

const PROGRAMA_ID = '6b1f0c2e-1d3a-4c5b-8e9f-0a1b2c3d4e5f';
const NUCLEO_ID = '7c2a1d3f-2e4b-4d6c-9f0a-1b2c3d4e5f60';
const OUTRO_NUCLEO = '8d3b2e4a-3f5c-4e7d-a01b-2c3d4e5f6071';
const autor = { id: 'admin-uuid', ip: '203.0.113.7' };
const admin = { id: 'admin-uuid', role: Role.ADMINISTRADOR };
const diretor = { id: 'diretor-uuid', role: Role.DIRETORES_NUCLEOS };

const programaAtual = {
  id: PROGRAMA_ID,
  nome: 'Programa Atual',
  descricao: 'Descrição atual',
  status: StatusRegistro.ATIVO,
  nucleoId: NUCLEO_ID,
  responsavelId: null as string | null,
  dataInicio: null as Date | null,
  participantes: [] as { userId: string }[],
};

const USER_A = '9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const USER_B = '0b1c2d3e-4f5a-4b6c-9d8e-0f1a2b3c4d5e';

// Chamadas de prisma mockadas recebem argumentos `any`; tipamos o primeiro argumento
type Chamada = {
  where: Record<string, unknown>;
  data?: Record<string, unknown>;
};
const argumento = (mock: jest.Mock, chamada = 0) =>
  (mock.mock.calls[chamada] as [Chamada])[0];

describe('ProgramaService', () => {
  let service: ProgramaService;
  let prisma: {
    programa: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      count: jest.Mock;
      groupBy: jest.Mock;
    };
    nucleo: { findFirst: jest.Mock };
    indicador: { updateMany: jest.Mock };
    programaParticipante: { deleteMany: jest.Mock; createMany: jest.Mock };
    user: { count: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { registrarAcao: jest.Mock };

  beforeEach(() => {
    prisma = {
      programa: {
        create: jest.fn().mockResolvedValue({ id: PROGRAMA_ID }),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: PROGRAMA_ID }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      nucleo: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ status: StatusRegistro.ATIVO }),
      },
      indicador: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      programaParticipante: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      // Por padrão todo usuário informado existe e está ativo
      user: {
        count: jest.fn((args: { where: { id: { in: string[] } } }) =>
          Promise.resolve(args.where.id.in.length),
        ),
      },
      $transaction: jest.fn(),
    };
    // Transação interativa: o callback recebe o próprio mock como cliente
    prisma.$transaction.mockImplementation(
      (operacao: (tx: typeof prisma) => unknown) => operacao(prisma),
    );
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    service = new ProgramaService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  describe('create', () => {
    it('cria o programa e audita os dados gravados', async () => {
      prisma.programa.findFirst.mockResolvedValue(null);
      prisma.programa.create.mockResolvedValue({
        id: PROGRAMA_ID,
        nome: 'Novo',
        descricao: null,
        nucleoId: NUCLEO_ID,
        status: StatusRegistro.ATIVO,
      });

      await service.create({ nome: 'Novo', nucleoId: NUCLEO_ID }, autor);

      expect(argumento(prisma.programa.create).data).toEqual({
        nome: 'Novo',
        descricao: null,
        nucleoId: NUCLEO_ID,
        responsavelId: null,
        dataInicio: null,
        participantes: { create: [] },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.CRIAR,
          entidade: 'Programa',
          entidadeId: PROGRAMA_ID,
          ip: autor.ip,
        }),
      );
    });

    it('grava responsável, data de início e participantes', async () => {
      prisma.programa.findFirst.mockResolvedValue(null);

      await service.create(
        {
          nome: 'Novo',
          nucleoId: NUCLEO_ID,
          responsavelId: USER_A,
          dataInicio: '2026-03-01',
          participanteIds: [USER_A, USER_B],
        },
        autor,
      );

      expect(argumento(prisma.programa.create).data).toMatchObject({
        responsavelId: USER_A,
        dataInicio: new Date('2026-03-01T00:00:00.000Z'),
        participantes: { create: [{ userId: USER_A }, { userId: USER_B }] },
      });
      expect(argumento(prisma.user.count).where).toEqual({
        id: { in: [USER_A, USER_B] },
        ativo: true,
        deletedAt: null,
      });
    });

    it('recusa responsável ou participante inexistente ou inativo', async () => {
      prisma.programa.findFirst.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(1);

      await expect(
        service.create(
          { nome: 'Novo', responsavelId: USER_A, participanteIds: [USER_B] },
          autor,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.programa.create).not.toHaveBeenCalled();
    });

    it('cria programa institucional (sem núcleo) sem consultar núcleo', async () => {
      prisma.programa.findFirst.mockResolvedValue(null);

      await service.create({ nome: 'Institucional' }, autor);

      expect(prisma.nucleo.findFirst).not.toHaveBeenCalled();
      expect(argumento(prisma.programa.create).data).toMatchObject({
        nucleoId: null,
      });
    });

    it('rejeita núcleo inexistente', async () => {
      prisma.nucleo.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ nome: 'Novo', nucleoId: NUCLEO_ID }, autor),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.programa.create).not.toHaveBeenCalled();
    });

    it('rejeita núcleo inativo', async () => {
      prisma.nucleo.findFirst.mockResolvedValue({
        status: StatusRegistro.INATIVO,
      });

      await expect(
        service.create({ nome: 'Novo', nucleoId: NUCLEO_ID }, autor),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita nome repetido no mesmo núcleo com mensagem clara', async () => {
      prisma.programa.findFirst.mockResolvedValue({ id: 'outro' });

      await expect(
        service.create({ nome: 'Novo', nucleoId: NUCLEO_ID }, autor),
      ).rejects.toThrow('Já existe um programa com este nome neste núcleo.');
      expect(argumento(prisma.programa.findFirst).where).toMatchObject({
        deletedAt: null,
        nucleoId: NUCLEO_ID,
        nome: { equals: 'Novo', mode: 'insensitive' },
      });
    });
  });

  describe('findAll', () => {
    it('devolve uma lista (compatível com as telas que usam GET /programas)', async () => {
      prisma.programa.findMany.mockResolvedValue([{ id: PROGRAMA_ID }]);

      await expect(service.findAll({}, admin)).resolves.toEqual([
        { id: PROGRAMA_ID },
      ]);
    });

    it('administrador vê todos os programas ativos por padrão', async () => {
      await service.findAll({}, admin);

      expect(argumento(prisma.programa.findMany).where).toEqual({
        deletedAt: null,
        status: StatusRegistro.ATIVO,
      });
    });

    it('administrador consulta inativos e arquivados', async () => {
      await service.findAll({ status: StatusRegistro.ARQUIVADO }, admin);

      expect(argumento(prisma.programa.findMany).where).toMatchObject({
        status: StatusRegistro.ARQUIVADO,
      });
    });

    it('diretor só vê programas dos seus núcleos e os institucionais', async () => {
      await service.findAll({}, diretor);

      expect(argumento(prisma.programa.findMany).where).toMatchObject({
        OR: [
          { nucleoId: null },
          { nucleo: { users: { some: { userId: diretor.id } } } },
        ],
      });
    });

    it('outros perfis não consultam programas inativos', async () => {
      await expect(
        service.findAll({ status: StatusRegistro.INATIVO }, diretor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('restringe consulta de programas arquivados apenas ao administrador (CT-031.04)', async () => {
      for (const role of [
        Role.DIRETORES_NUCLEOS,
        Role.EQUIPE_COMUNICACAO,
        Role.EQUIPE_GESTAO,
      ]) {
        await expect(
          service.findAll(
            { status: StatusRegistro.ARQUIVADO },
            { id: 'user-nao-adm', role },
          ),
        ).rejects.toThrow(ForbiddenException);
      }
      expect(prisma.programa.findMany).not.toHaveBeenCalled();
    });

    it('aplica os filtros de nome e núcleo', async () => {
      await service.findAll({ nome: 'educ', nucleoId: NUCLEO_ID }, admin);

      expect(argumento(prisma.programa.findMany).where).toMatchObject({
        nome: { contains: 'educ', mode: 'insensitive' },
        nucleoId: NUCLEO_ID,
      });
    });
  });

  describe('findOne', () => {
    it('retorna 404 quando o programa está fora do escopo do usuário', async () => {
      prisma.programa.findFirst.mockResolvedValue(null);

      await expect(service.findOne(PROGRAMA_ID, diretor)).rejects.toThrow(
        NotFoundException,
      );
      expect(argumento(prisma.programa.findFirst).where).toMatchObject({
        id: PROGRAMA_ID,
        deletedAt: null,
        status: StatusRegistro.ATIVO,
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      // 1ª busca: programa atual; 2ª: verificação de nome repetido
      prisma.programa.findFirst
        .mockResolvedValueOnce(programaAtual)
        .mockResolvedValueOnce(null);
    });

    it('audita só os campos alterados, com valores antigos e novos', async () => {
      await service.update(
        PROGRAMA_ID,
        { nome: 'Nome Novo', descricao: 'Descrição atual' },
        autor,
      );

      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.ATUALIZAR,
          dadosAntigos: { nome: 'Programa Atual' },
          dadosNovos: { nome: 'Nome Novo' },
        }),
      );
    });

    it('permite tornar o programa institucional com nucleoId null', async () => {
      await service.update(PROGRAMA_ID, { nucleoId: null }, autor);

      expect(argumento(prisma.programa.update).data).toMatchObject({
        nucleoId: null,
      });
      expect(prisma.nucleo.findFirst).not.toHaveBeenCalled();
    });

    it('valida o novo núcleo', async () => {
      prisma.nucleo.findFirst.mockResolvedValue(null);

      await expect(
        service.update(PROGRAMA_ID, { nucleoId: OUTRO_NUCLEO }, autor),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.programa.update).not.toHaveBeenCalled();
    });

    it('rejeita requisição sem alterações', async () => {
      await expect(
        service.update(PROGRAMA_ID, { nome: 'Programa Atual' }, autor),
      ).rejects.toThrow(BadRequestException);
    });

    it('substitui os participantes e audita a troca', async () => {
      prisma.programa.findFirst.mockReset().mockResolvedValueOnce({
        ...programaAtual,
        participantes: [{ userId: USER_A }],
      });

      await service.update(PROGRAMA_ID, { participanteIds: [USER_B] }, autor);

      expect(prisma.programaParticipante.deleteMany).toHaveBeenCalledWith({
        where: { programaId: PROGRAMA_ID },
      });
      expect(prisma.programaParticipante.createMany).toHaveBeenCalledWith({
        data: [{ programaId: PROGRAMA_ID, userId: USER_B }],
      });
      // Só o participante novo é validado
      expect(argumento(prisma.user.count).where).toMatchObject({
        id: { in: [USER_B] },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosAntigos: { participanteIds: [USER_A] },
          dadosNovos: { participanteIds: [USER_B] },
        }),
      );
    });

    it('mesmos participantes em outra ordem não contam como alteração', async () => {
      prisma.programa.findFirst.mockReset().mockResolvedValueOnce({
        ...programaAtual,
        participantes: [{ userId: USER_A }, { userId: USER_B }],
      });

      await expect(
        service.update(
          PROGRAMA_ID,
          { participanteIds: [USER_B, USER_A] },
          autor,
        ),
      ).rejects.toThrow('Nenhuma alteração informada.');
    });

    it('limpa responsável e data de início com null', async () => {
      prisma.programa.findFirst.mockReset().mockResolvedValueOnce({
        ...programaAtual,
        responsavelId: USER_A,
        dataInicio: new Date('2026-03-01T00:00:00.000Z'),
      });

      await service.update(
        PROGRAMA_ID,
        { responsavelId: null, dataInicio: null },
        autor,
      );

      expect(argumento(prisma.programa.update).data).toMatchObject({
        responsavelId: null,
        dataInicio: null,
      });
      expect(prisma.programaParticipante.deleteMany).not.toHaveBeenCalled();
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosAntigos: { responsavelId: USER_A, dataInicio: '2026-03-01' },
          dadosNovos: { responsavelId: null, dataInicio: null },
        }),
      );
    });

    it('retorna 404 para programa excluído', async () => {
      prisma.programa.findFirst.mockReset().mockResolvedValue(null);

      await expect(
        service.update(PROGRAMA_ID, { nome: 'Outro' }, autor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('mudança de status', () => {
    it('desativa, auditando o status anterior', async () => {
      prisma.programa.findFirst.mockResolvedValue(programaAtual);

      await expect(service.desativar(PROGRAMA_ID, autor)).resolves.toEqual({
        message: 'Programa desativado com sucesso.',
      });
      expect(argumento(prisma.programa.updateMany).where).toEqual({
        id: PROGRAMA_ID,
        deletedAt: null,
        status: StatusRegistro.ATIVO,
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.DESATIVAR,
          dadosAntigos: { status: StatusRegistro.ATIVO },
          dadosNovos: { status: StatusRegistro.INATIVO },
        }),
      );
    });

    it('não desativa um programa já inativo', async () => {
      prisma.programa.findFirst.mockResolvedValue({
        ...programaAtual,
        status: StatusRegistro.INATIVO,
      });

      await expect(service.desativar(PROGRAMA_ID, autor)).rejects.toThrow(
        ConflictException,
      );
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('reativa um programa arquivado', async () => {
      prisma.programa.findFirst.mockResolvedValue({
        ...programaAtual,
        status: StatusRegistro.ARQUIVADO,
      });

      await service.reativar(PROGRAMA_ID, autor);

      expect(argumento(prisma.programa.updateMany).data).toEqual({
        status: StatusRegistro.ATIVO,
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({ acao: AcaoAuditoria.RESTAURAR }),
      );
    });

    it('arquiva programa ativo e remove os vínculos dos indicadores mantendo-os cadastrados (CT-031.01)', async () => {
      prisma.programa.findFirst.mockResolvedValue(programaAtual);
      prisma.indicador.updateMany.mockResolvedValue({ count: 2 });

      await expect(service.arquivar(PROGRAMA_ID, autor)).resolves.toEqual({
        message: 'Programa arquivado com sucesso.',
        indicadoresDesvinculados: 2,
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(argumento(prisma.programa.updateMany)).toEqual({
        where: {
          id: PROGRAMA_ID,
          deletedAt: null,
          status: StatusRegistro.ATIVO,
        },
        data: { status: StatusRegistro.ARQUIVADO },
      });
      expect(argumento(prisma.indicador.updateMany)).toEqual({
        where: { programaId: PROGRAMA_ID, deletedAt: null },
        data: { programaId: null },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.ARQUIVAR,
          dadosAntigos: { status: StatusRegistro.ATIVO },
          dadosNovos: {
            status: StatusRegistro.ARQUIVADO,
            indicadoresDesvinculados: 2,
          },
        }),
      );
    });

    it('arquiva programa sem indicadores vinculados normalmente (CT-031.05)', async () => {
      prisma.programa.findFirst.mockResolvedValue(programaAtual);
      prisma.indicador.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.arquivar(PROGRAMA_ID, autor)).resolves.toEqual({
        message: 'Programa arquivado com sucesso.',
        indicadoresDesvinculados: 0,
      });
      expect(argumento(prisma.indicador.updateMany)).toEqual({
        where: { programaId: PROGRAMA_ID, deletedAt: null },
        data: { programaId: null },
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.ARQUIVAR,
          dadosNovos: {
            status: StatusRegistro.ARQUIVADO,
            indicadoresDesvinculados: 0,
          },
        }),
      );
    });

    it('não audita nem desvincula indicadores quando outra requisição alterou o status antes', async () => {
      prisma.programa.findFirst.mockResolvedValue(programaAtual);
      prisma.programa.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.arquivar(PROGRAMA_ID, autor)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.indicador.updateMany).not.toHaveBeenCalled();
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const comVinculos = (indicadores: number, acoes: number) => ({
      nome: 'Programa Atual',
      status: StatusRegistro.ATIVO,
      nucleoId: NUCLEO_ID,
      _count: { indicadores, acoes },
    });

    it('exclui logicamente e audita', async () => {
      prisma.programa.findFirst.mockResolvedValue(comVinculos(0, 0));

      await service.remove(PROGRAMA_ID, autor);

      expect(argumento(prisma.programa.updateMany).data).toEqual({
        deletedAt: expect.any(Date) as unknown,
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.EXCLUIR_LOGICO,
          dadosAntigos: {
            nome: 'Programa Atual',
            status: StatusRegistro.ATIVO,
            nucleoId: NUCLEO_ID,
          },
        }),
      );
    });

    it('não exclui programa com indicadores ou ações vigentes', async () => {
      prisma.programa.findFirst.mockResolvedValue(comVinculos(2, 1));

      await expect(service.remove(PROGRAMA_ID, autor)).rejects.toThrow(
        'O programa não pode ser excluído pois possui indicadores e ações vinculados.',
      );
      expect(prisma.programa.updateMany).not.toHaveBeenCalled();
    });

    it('retorna 404 para programa inexistente ou já excluído', async () => {
      prisma.programa.findFirst.mockResolvedValue(null);

      await expect(service.remove(PROGRAMA_ID, autor)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
