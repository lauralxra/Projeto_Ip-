import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { AcaoAuditoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';
import { RequestRecoveryDto } from './dto/request-recovery.dto';

// bcrypt real deixaria a suíte lenta (e sujeita a timeout); aqui o "hash" é previsível
jest.mock('bcrypt', () => ({
  hashSync: (valor: string) => `hash:${valor}`,
  hash: jest.fn((valor: string) => Promise.resolve(`hash:${valor}`)),
  compare: jest.fn((valor: string, hash: string) =>
    Promise.resolve(hash === `hash:${valor}`),
  ),
}));

describe('AuthService — recuperação de senha (UC02)', () => {
  const EMAIL = 'maria@exemplo.com';
  const USER_ID = 'user-uuid';
  const TOKEN_ID = 'token-uuid';
  const NOVA_SENHA = 'NovaSenhaForte2026';

  let service: AuthService;
  let prisma: {
    user: { findFirst: jest.Mock; update: jest.Mock };
    passwordResetToken: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let audit: { registrarAcao: jest.Mock };
  let mail: { sendPasswordReset: jest.Mock; sendPasswordChanged: jest.Mock };

  const tokenValido = (codigo = '123456', extra = {}) => ({
    id: TOKEN_ID,
    userId: USER_ID,
    codigoHash: `hash:${codigo}`,
    expiraEm: new Date(Date.now() + 10 * 60 * 1000),
    ...extra,
  });

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        update: jest
          .fn()
          .mockResolvedValue({ id: USER_ID, nome: 'Maria', email: EMAIL }),
      },
      passwordResetToken: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({}),
      },
      // Aceita as duas formas: lista de operações ou função interativa
      $transaction: jest.fn((arg: unknown) =>
        typeof arg === 'function'
          ? (arg as (tx: unknown) => Promise<unknown>)(prisma)
          : Promise.all(arg as Promise<unknown>[]),
      ),
    };
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    mail = {
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
      sendPasswordChanged: jest.fn().mockResolvedValue(undefined),
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      audit as unknown as AuditService,
      mail as unknown as MailService,
    );
  });

  describe('solicitarRecuperacao', () => {
    const MENSAGEM = {
      message: 'Código de recuperação enviado para o e-mail informado.',
    };

    it('rejeita com 404 e-mail não cadastrado no sistema, sem gerar código nem enviar e-mail (BUG-009 / CT-002.02 / FE01)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.solicitarRecuperacao(EMAIL)).rejects.toThrow(
        new NotFoundException('E-mail não cadastrado no sistema.'),
      );
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('rejeita formato de e-mail inválido sem domínio completo (ex.: qualquercoisa@email) no RequestRecoveryDto', async () => {
      const dto = plainToInstance(RequestRecoveryDto, {
        email: 'qualquercoisa@email',
      });
      const erros = await validate(dto);

      expect(erros.map((e) => e.property)).toEqual(['email']);
    });

    it('invalida códigos anteriores, grava só o hash e envia um código de 6 dígitos', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: USER_ID, email: EMAIL });

      await expect(service.solicitarRecuperacao(EMAIL)).resolves.toEqual(
        MENSAGEM,
      );

      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, usado: false },
        data: { usado: true },
      });
      const [para, codigo] = mail.sendPasswordReset.mock.calls[0] as [
        string,
        string,
      ];
      expect(para).toBe(EMAIL);
      expect(codigo).toMatch(/^\d{6}$/);
      const [{ data }] = prisma.passwordResetToken.create.mock.calls[0] as [
        { data: { codigoHash: string } },
      ];
      expect(data.codigoHash).toBe(`hash:${codigo}`);
    });

    it('não gera código novo antes de 60 segundos do anterior', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: USER_ID, email: EMAIL });
      prisma.passwordResetToken.findMany.mockResolvedValue([
        { createdAt: new Date(Date.now() - 20 * 1000) },
      ]);

      await expect(service.solicitarRecuperacao(EMAIL)).resolves.toEqual(
        MENSAGEM,
      );
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('não gera mais de 3 códigos por hora, impedindo chutar o código pedindo outro', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: USER_ID, email: EMAIL });
      prisma.passwordResetToken.findMany.mockResolvedValue([
        { createdAt: new Date(Date.now() - 5 * 60 * 1000) },
        { createdAt: new Date(Date.now() - 10 * 60 * 1000) },
        { createdAt: new Date(Date.now() - 20 * 60 * 1000) },
      ]);

      await expect(service.solicitarRecuperacao(EMAIL)).resolves.toEqual(
        MENSAGEM,
      );
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('gera código novo depois do intervalo mínimo, abaixo do limite por hora', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: USER_ID, email: EMAIL });
      prisma.passwordResetToken.findMany.mockResolvedValue([
        { createdAt: new Date(Date.now() - 2 * 60 * 1000) },
      ]);

      await service.solicitarRecuperacao(EMAIL);

      expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
      expect(mail.sendPasswordReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('validarCodigoRecuperacao', () => {
    it('aceita o código certo e devolve a tentativa reservada', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(tokenValido());

      await expect(
        service.validarCodigoRecuperacao({ email: EMAIL, codigo: '123456' }),
      ).resolves.toEqual({ valido: true });
      expect(prisma.passwordResetToken.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: TOKEN_ID, tentativas: { lt: 5 } },
        data: { tentativas: { increment: 1 } },
      });
      expect(prisma.passwordResetToken.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: TOKEN_ID, tentativas: { gt: 0 } },
        data: { tentativas: { decrement: 1 } },
      });
    });

    it('código errado não devolve a tentativa', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(tokenValido());

      await expect(
        service.validarCodigoRecuperacao({ email: EMAIL, codigo: '000000' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledTimes(1);
    });

    it('recusa código errado com a mensagem genérica', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(tokenValido());

      await expect(
        service.validarCodigoRecuperacao({ email: EMAIL, codigo: '000000' }),
      ).rejects.toThrow('Código inválido ou expirado.');
    });

    it('recusa código expirado sem contar tentativa', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(
        tokenValido('123456', { expiraEm: new Date(Date.now() - 1000) }),
      );

      await expect(
        service.validarCodigoRecuperacao({ email: EMAIL, codigo: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.passwordResetToken.updateMany).not.toHaveBeenCalled();
    });

    it('responde 429 quando o código já gastou as 5 tentativas', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(tokenValido());
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

      const erro = await service
        .validarCodigoRecuperacao({ email: EMAIL, codigo: '123456' })
        .catch((e: unknown) => e);

      expect(erro).toBeInstanceOf(HttpException);
      expect((erro as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    });

    it('recusa quando não há código pendente (ou o e-mail não existe)', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(null);

      await expect(
        service.validarCodigoRecuperacao({ email: EMAIL, codigo: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('redefinirSenha', () => {
    const dto = {
      email: EMAIL,
      codigo: '123456',
      novaSenha: NOVA_SENHA,
      confirmacaoSenha: NOVA_SENHA,
    };

    it('troca a senha, desbloqueia a conta, encerra as sessões e audita sem a senha', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(tokenValido());

      await expect(service.redefinirSenha(dto, '203.0.113.7')).resolves.toEqual(
        { message: 'Senha redefinida com sucesso.' },
      );

      const [{ data }] = prisma.user.update.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(data.senhaHash).toBe(`hash:${NOVA_SENHA}`);
      expect(data.tentativas).toBe(0);
      expect(data.bloqueioAte).toBeNull();
      expect(data.sessoesInvalidadasEm).toBeInstanceOf(Date);

      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          acao: AcaoAuditoria.ATUALIZAR,
          dadosNovos: { senha: 'redefinida', via: 'recuperacao_de_senha' },
        }),
        prisma,
      );
      expect(JSON.stringify(audit.registrarAcao.mock.calls)).not.toContain(
        NOVA_SENHA,
      );
      expect(mail.sendPasswordChanged).toHaveBeenCalledWith({
        email: EMAIL,
        nome: 'Maria',
      });
    });

    it('não troca a senha com código errado', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(tokenValido());

      await expect(
        service.redefinirSenha({ ...dto, codigo: '000000' }, '203.0.113.7'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('não troca a senha se o código foi consumido por outra requisição ao mesmo tempo', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(tokenValido());
      prisma.passwordResetToken.updateMany
        .mockResolvedValueOnce({ count: 1 }) // reserva da tentativa
        .mockResolvedValueOnce({ count: 1 }) // devolução (código certo)
        .mockResolvedValueOnce({ count: 0 }); // consumo dentro da transação

      await expect(
        service.redefinirSenha(dto, '203.0.113.7'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
