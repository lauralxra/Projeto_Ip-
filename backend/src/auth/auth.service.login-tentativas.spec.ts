import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hashSync: (valor: string) => `hash:${valor}`,
  hash: jest.fn((valor: string) => Promise.resolve(`hash:${valor}`)),
  compare: jest.fn((senha: string, hash: string) =>
    Promise.resolve(hash === `hash:${senha}`),
  ),
}));

describe('AuthService — Login, Bloqueio de Tentativas e Anti-enumeração (UC01, UC02)', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    loginLog: {
      create: jest.Mock;
    };
    passwordResetToken: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let jwt: { signAsync: jest.Mock };
  let audit: {
    registrarAcao: jest.Mock;
    registrarTentativaLogin: jest.Mock;
  };
  let mail: { sendPasswordReset: jest.Mock; sendPasswordChanged: jest.Mock };

  const meta = { ip: '127.0.0.1', userAgent: 'test-agent' };

  const USER = {
    id: 'user-teste-id',
    nome: 'Laura Teste',
    email: 'laura.teste@ipe.org.br',
    senhaHash: 'hash:Correta@123',
    perfil: Role.ADMINISTRADOR,
    ativo: true,
    tentativas: 0,
    bloqueioAte: null,
  };

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      loginLog: {
        create: jest.fn().mockResolvedValue({}),
      },
      passwordResetToken: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((arg: unknown) =>
        typeof arg === 'function'
          ? (arg as (tx: unknown) => Promise<unknown>)(prisma)
          : Promise.all(arg as Promise<unknown>[]),
      ),
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('jwt-mock-token'),
    };
    audit = {
      registrarAcao: jest.fn().mockResolvedValue({}),
      registrarTentativaLogin: jest.fn().mockResolvedValue({}),
    };
    mail = {
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
      sendPasswordChanged: jest.fn().mockResolvedValue(undefined),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      audit as unknown as AuditService,
      mail as unknown as MailService,
    );
  });

  describe('UC01 — Realizar Login e Bloqueio após falhas (CT-001.01, CT-001.02)', () => {
    it('CT-001.01: autentica com credenciais corretas e zera tentativas', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...USER,
        tentativas: 2,
      });
      prisma.user.update.mockResolvedValue({ ...USER, tentativas: 0 });

      const resultado = await service.login(
        { email: USER.email, password: 'Correta@123' },
        meta,
      );

      expect(resultado).toHaveProperty('accessToken', 'jwt-mock-token');
      expect(resultado.user).toMatchObject({
        id: USER.id,
        email: USER.email,
        perfil: USER.perfil,
      });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tentativas: 0 }),
        }),
      );
    });

    it('CT-001.02: rejeita senha incorreta e incrementa contador de tentativas', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...USER,
        tentativas: 1,
      });

      await expect(
        service.login({ email: USER.email, password: 'SenhaErrada' }, meta),
      ).rejects.toThrow(UnauthorizedException);

      const updateCall = prisma.user.update.mock.calls[0] as [
        { data: { tentativas: unknown } },
      ];
      expect(updateCall[0].data.tentativas).toEqual({ increment: 1 });
    });

    it('CT-001.02: bloqueia conta por 15 minutos ao atingir 5 tentativas incorretas', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...USER,
        tentativas: 4,
      });

      await expect(
        service.login({ email: USER.email, password: 'SenhaErrada' }, meta),
      ).rejects.toThrow(UnauthorizedException);

      const updateCall = prisma.user.update.mock.calls[0] as [
        { data: { bloqueioAte: unknown } },
      ];
      expect(updateCall[0].data.bloqueioAte).toBeInstanceOf(Date);
    });

    it('impede login enquanto o bloqueio temporário estiver ativo', async () => {
      const bloqueadoAte = new Date(Date.now() + 10 * 60 * 1000);
      prisma.user.findFirst.mockResolvedValue({
        ...USER,
        tentativas: 5,
        bloqueioAte: bloqueadoAte,
      });

      await expect(
        service.login({ email: USER.email, password: 'Correta@123' }, meta),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwt.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('UC02 — Proteção contra Enumeração de Usuários (BUG-009 / CT-002.02)', () => {
    it('responde mensagem idêntica para e-mail inexistente sem vazar status (OWASP)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const resposta = await service.solicitarRecuperacao(
        'inexistente@ipe.org.br',
      );

      expect(resposta).toEqual({
        message: 'Se o e-mail estiver cadastrado, você receberá o código.',
      });
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });
});
