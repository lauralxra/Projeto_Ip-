import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
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
