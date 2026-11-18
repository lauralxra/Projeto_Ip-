import {
  BadRequestException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  AcaoAuditoria,
  Role,
  StatusRegistro,
  TipoNotificacao,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import { NotificacaoService } from './notificacao.service';

const ADMIN_ID = '0b7e1b9e-6a51-4e8f-9a3f-2c1d4e5f6a70';
const NUCLEO_ID = '1c8f2c0f-7b62-4f90-8b40-3d2e5f607b81';
const USER_A = '2d903d10-8c73-4a01-9c51-4e3f60718c92';
const USER_B = '3ea14e21-9d84-4b12-8d62-5f4071829da3';
const NOTIF_ID = '4fb25f32-ae95-4c23-9e73-60518293aeb4';

// Deixa a fila de microtasks andar para o envio de e-mails em segundo plano terminar
const aguardarSegundoPlano = () => new Promise((r) => setImmediate(r));

function criarPrismaMock() {
  const prisma = {
    user: { findMany: jest.fn() },
    nucleo: { findFirst: jest.fn(), findMany: jest.fn() },
    notificacao: {
      create: jest.fn().mockResolvedValue({ id: NOTIF_ID }),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    notificacaoUsuario: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === 'function'
      ? (arg as (tx: unknown) => unknown)(prisma)
      : Promise.all(arg as Promise<unknown>[]),
  );
  return prisma;
}

describe('NotificacaoService', () => {
  let service: NotificacaoService;
  let prisma: ReturnType<typeof criarPrismaMock>;
  let audit: { registrarAcao: jest.Mock };
  let mail: { sendPasswordChanged: jest.Mock; sendNotificacao: jest.Mock };

  const dtoBase: CreateNotificacaoDto = {
    titulo: 'Prazo de preenchimento',
    mensagem: 'O prazo do Q1 encerra em 3 dias.',
    tipo: TipoNotificacao.AVISO_GERAL,
  };

  beforeEach(() => {
    prisma = criarPrismaMock();
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    mail = {
      sendPasswordChanged: jest.fn().mockResolvedValue(undefined),
      sendNotificacao: jest.fn().mockResolvedValue(undefined),
    };
    service = new NotificacaoService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      mail as unknown as MailService,
    );
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  const whereDoFindMany = (chamada = 0) =>
    (
      prisma.user.findMany.mock.calls[chamada] as [
        { where: Record<string, unknown> },
      ]
    )[0].where;

  describe('notificarSenhaAlterada', () => {
    const destinatario = { email: 'maria@ipe.org.br', nome: 'Maria' };

    it('envia o aviso de segurança por e-mail', async () => {
      await expect(service.notificarSenhaAlterada(destinatario)).resolves.toBe(
        true,
      );
      expect(mail.sendPasswordChanged).toHaveBeenCalledWith(destinatario);
    });

    it('não lança erro quando o SMTP falha e registra no log', async () => {
      mail.sendPasswordChanged.mockRejectedValue(
        new ServiceUnavailableException('SMTP fora do ar'),
      );

      await expect(service.notificarSenhaAlterada(destinatario)).resolves.toBe(
        false,
      );
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('exige um destino explícito ou "todos": true', async () => {
      await expect(service.create(dtoBase, ADMIN_ID, '::1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.notificacao.create).not.toHaveBeenCalled();
    });

    it('não aceita "todos" combinado com filtros', async () => {
      await expect(
        service.create(
          { ...dtoBase, todos: true, perfilAlvo: Role.EQUIPE_GESTAO },
          ADMIN_ID,
          '::1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('RN01: com núcleo e sem perfil, envia só aos diretores ativos do núcleo', async () => {
      prisma.nucleo.findFirst.mockResolvedValue({
        status: StatusRegistro.ATIVO,
      });
      prisma.user.findMany.mockResolvedValueOnce([{ id: USER_A }]);
      prisma.user.findMany.mockResolvedValueOnce([
        { id: USER_A, email: 'a@ipe.org.br' },
      ]);

      const resultado = await service.create(
        { ...dtoBase, nucleoId: NUCLEO_ID },
        ADMIN_ID,
        '::1',
      );

      expect(whereDoFindMany()).toEqual({
        ativo: true,
        deletedAt: null,
        nucleos: { some: { nucleoId: NUCLEO_ID } },
        perfil: Role.DIRETORES_NUCLEOS,
      });
      expect(prisma.notificacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nucleoId: NUCLEO_ID,
            criadorId: ADMIN_ID,
            destinatarios: { create: [{ userId: USER_A }] },
          }) as unknown,
        }),
      );
      expect(resultado).toMatchObject({ id: NOTIF_ID, totalDestinatarios: 1 });
    });

    it('respeita o perfil-alvo informado junto com o núcleo', async () => {
      prisma.nucleo.findFirst.mockResolvedValue({
        status: StatusRegistro.ATIVO,
      });
      prisma.user.findMany.mockResolvedValue([{ id: USER_A }]);

      await service.create(
        { ...dtoBase, nucleoId: NUCLEO_ID, perfilAlvo: Role.EQUIPE_GESTAO },
        ADMIN_ID,
        '::1',
      );

      expect(whereDoFindMany().perfil).toBe(Role.EQUIPE_GESTAO);
    });

    it('rejeita destinatários inexistentes, inativos ou fora do filtro', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: USER_A }]);

      await expect(
        service.create(
          { ...dtoBase, destinatarioIds: [USER_A, USER_B] },
          ADMIN_ID,
          '::1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(whereDoFindMany()).toEqual({
        ativo: true,
        deletedAt: null,
        id: { in: [USER_A, USER_B] },
      });
      expect(prisma.notificacao.create).not.toHaveBeenCalled();
    });

    it('rejeita núcleo inexistente', async () => {
      prisma.nucleo.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ ...dtoBase, nucleoId: NUCLEO_ID }, ADMIN_ID, '::1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejeita núcleo inativo', async () => {
      prisma.nucleo.findFirst.mockResolvedValue({
        status: StatusRegistro.INATIVO,
      });

      await expect(
        service.create({ ...dtoBase, nucleoId: NUCLEO_ID }, ADMIN_ID, '::1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita quando nenhum usuário atende aos critérios', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await expect(
        service.create(
          { ...dtoBase, perfilAlvo: Role.EQUIPE_COMUNICACAO },
          ADMIN_ID,
          '::1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('audita a emissão na mesma transação', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: USER_A }, { id: USER_B }]);

      await service.create({ ...dtoBase, todos: true }, ADMIN_ID, '10.0.0.1');

      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: ADMIN_ID,
          acao: AcaoAuditoria.CRIAR,
          entidade: 'Notificacao',
          entidadeId: NOTIF_ID,
          ip: '10.0.0.1',
          dadosNovos: expect.objectContaining({
            origem: 'manual',
            totalDestinatarios: 2,
          }) as unknown,
        }),
        prisma,
      );
    });

    it('envia os e-mails e registra o envio por destinatário', async () => {
      prisma.user.findMany
        .mockResolvedValueOnce([{ id: USER_A }, { id: USER_B }])
        .mockResolvedValueOnce([
          { id: USER_A, email: 'a@ipe.org.br' },
          { id: USER_B, email: 'b@ipe.org.br' },
        ]);
      mail.sendNotificacao
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('SMTP fora do ar'));

      await service.create({ ...dtoBase, todos: true }, ADMIN_ID, '::1');
      await aguardarSegundoPlano();

      expect(mail.sendNotificacao).toHaveBeenCalledWith(
        'a@ipe.org.br',
        dtoBase.titulo,
        dtoBase.mensagem,
      );
      expect(prisma.notificacaoUsuario.update).toHaveBeenCalledWith({
        where: {
          notificacaoId_userId: { notificacaoId: NOTIF_ID, userId: USER_A },
        },
        data: { emailEnviadoEm: expect.any(Date) as unknown, emailErro: null },
      });
      expect(prisma.notificacaoUsuario.update).toHaveBeenCalledWith({
        where: {
          notificacaoId_userId: { notificacaoId: NOTIF_ID, userId: USER_B },
        },
        data: { emailErro: 'SMTP fora do ar' },
      });
    });

    it('uma falha no envio em segundo plano não gera rejeição sem tratamento', async () => {
      prisma.user.findMany
        .mockResolvedValueOnce([{ id: USER_A }])
        .mockRejectedValueOnce(new Error('banco fora do ar'));

      await expect(
        service.create({ ...dtoBase, todos: true }, ADMIN_ID, '::1'),
      ).resolves.toMatchObject({ id: NOTIF_ID });
      await aguardarSegundoPlano();

      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('enviarLembreteTrimestral', () => {
    const nucleos = [
      { id: NUCLEO_ID, nome: 'NEI' },
      { id: '5ac36043-bfa6-4d34-8f84-7162a3a4bfc5', nome: 'NURI' },
    ];

    it('envia só aos diretores, como notificação do sistema (criador nulo)', async () => {
      prisma.nucleo.findMany.mockResolvedValue([nucleos[0]]);
      prisma.user.findMany.mockResolvedValue([{ id: USER_A }]);

      const resumo = await service.enviarLembreteTrimestral();

      expect(resumo).toEqual({ enviados: 1, ignorados: 0, falhas: 0 });
      expect(whereDoFindMany()).toMatchObject({
        perfil: Role.DIRETORES_NUCLEOS,
        nucleos: { some: { nucleoId: NUCLEO_ID } },
      });
      expect(prisma.notificacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            criadorId: null,
            tipo: TipoNotificacao.PRAZO_PREENCHIMENTO,
          }) as unknown,
        }),
      );
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null, ip: null }),
        prisma,
      );
    });

    it('não repete o lembrete já enviado e ignora núcleo sem diretores', async () => {
      prisma.nucleo.findMany.mockResolvedValue(nucleos);
      prisma.notificacao.findFirst
        .mockResolvedValueOnce({ id: NOTIF_ID })
        .mockResolvedValueOnce(null);
      prisma.user.findMany.mockResolvedValue([]);

      const resumo = await service.enviarLembreteTrimestral();

      expect(resumo).toEqual({ enviados: 0, ignorados: 2, falhas: 0 });
      expect(prisma.notificacao.create).not.toHaveBeenCalled();
    });

    it('a falha em um núcleo não impede os demais', async () => {
      prisma.nucleo.findMany.mockResolvedValue(nucleos);
      prisma.user.findMany.mockResolvedValue([{ id: USER_A }]);
      prisma.notificacao.create
        .mockRejectedValueOnce(new Error('falha no banco'))
        .mockResolvedValueOnce({ id: NOTIF_ID });

      const resumo = await service.enviarLembreteTrimestral();

      expect(resumo).toEqual({ enviados: 1, ignorados: 0, falhas: 1 });
    });
  });

  describe('marcarComoLida', () => {
    it('busca pela notificação do próprio usuário', async () => {
      prisma.notificacaoUsuario.findUnique.mockResolvedValue({ isRead: false });

      await service.marcarComoLida(NOTIF_ID, USER_A);

      expect(prisma.notificacaoUsuario.update).toHaveBeenCalledWith({
        where: {
          notificacaoId_userId: { notificacaoId: NOTIF_ID, userId: USER_A },
        },
        data: { isRead: true, readAt: expect.any(Date) as unknown },
      });
    });

    it('retorna 404 quando a notificação não é do usuário', async () => {
      prisma.notificacaoUsuario.findUnique.mockResolvedValue(null);

      await expect(service.marcarComoLida(NOTIF_ID, USER_B)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.notificacaoUsuario.update).not.toHaveBeenCalled();
    });

    it('não altera a data de leitura de notificação já lida', async () => {
      prisma.notificacaoUsuario.findUnique.mockResolvedValue({ isRead: true });

      await service.marcarComoLida(NOTIF_ID, USER_A);

      expect(prisma.notificacaoUsuario.update).not.toHaveBeenCalled();
    });
  });

  describe('findByUsuario', () => {
    it('pagina apenas as notificações do usuário', async () => {
      await expect(
        service.findByUsuario(USER_A, { pagina: 2, limite: 10 }),
      ).resolves.toEqual({ itens: [], total: 0, pagina: 2, limite: 10 });

      expect(prisma.notificacaoUsuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_A },
          skip: 10,
          take: 10,
        }),
      );
    });
  });
});
