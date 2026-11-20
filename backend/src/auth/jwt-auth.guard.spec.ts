import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwt: { verifyAsync: jest.Mock };

  const contextWith = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jwt = { verifyAsync: jest.fn() };
    guard = new JwtAuthGuard(jwt as unknown as JwtService);
  });

  it('preenche request.user a partir de um token válido', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: 'uuid',
      role: Role.ADMINISTRADOR,
    });
    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer token-valido' },
    };

    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'uuid', role: Role.ADMINISTRADOR });
  });

  it('recusa requisição sem token', async () => {
    await expect(
      guard.canActivate(contextWith({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('recusa token inválido ou expirado', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(
      guard.canActivate(
        contextWith({ headers: { authorization: 'Bearer expirado' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('libera rotas marcadas com @Public() sem exigir token', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;
    const guardGlobal = new JwtAuthGuard(
      jwt as unknown as JwtService,
      reflector,
    );

    await expect(
      guardGlobal.canActivate(contextWith({ headers: {} })),
    ).resolves.toBe(true);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  describe('sessões encerradas (UC02)', () => {
    const agoraEmSegundos = Math.floor(Date.now() / 1000);
    let prisma: { user: { findUnique: jest.Mock } };
    let guardComBanco: JwtAuthGuard;

    beforeEach(() => {
      prisma = { user: { findUnique: jest.fn() } };
      guardComBanco = new JwtAuthGuard(
        jwt as unknown as JwtService,
        undefined,
        prisma as unknown as PrismaService,
      );
    });

    const requisicao = () =>
      contextWith({ headers: { authorization: 'Bearer token' } });

    it('recusa token emitido antes da invalidação das sessões', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'uuid',
        role: Role.EQUIPE_GESTAO,
        iat: agoraEmSegundos - 3600,
      });
      prisma.user.findUnique.mockResolvedValue({
        sessoesInvalidadasEm: new Date(),
      });

      await expect(
        guardComBanco.canActivate(requisicao()),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('aceita token emitido depois da invalidação (novo login)', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'uuid',
        role: Role.EQUIPE_GESTAO,
        iat: agoraEmSegundos,
      });
      prisma.user.findUnique.mockResolvedValue({
        sessoesInvalidadasEm: new Date((agoraEmSegundos - 60) * 1000),
      });

      await expect(guardComBanco.canActivate(requisicao())).resolves.toBe(true);
    });

    it('aceita token quando as sessões nunca foram invalidadas', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'uuid',
        role: Role.EQUIPE_GESTAO,
        iat: agoraEmSegundos - 3600,
      });
      prisma.user.findUnique.mockResolvedValue({ sessoesInvalidadasEm: null });

      await expect(guardComBanco.canActivate(requisicao())).resolves.toBe(true);
    });

    it('recusa token de usuário que não existe mais', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'uuid',
        role: Role.EQUIPE_GESTAO,
        iat: agoraEmSegundos,
      });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        guardComBanco.canActivate(requisicao()),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  it('exige token em rotas sem @Public() quando usado como guard global', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guardGlobal = new JwtAuthGuard(
      jwt as unknown as JwtService,
      reflector,
    );

    await expect(
      guardGlobal.canActivate(contextWith({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
