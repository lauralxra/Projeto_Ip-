import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { Roles, RolesMessage } from './roles.decorators';

class RotasDeTeste {
  @Roles(Role.ADMINISTRADOR)
  @RolesMessage('Você não possui permissão para atualizar o núcleo.')
  comMensagem() {}

  @Roles(Role.ADMINISTRADOR)
  semMensagem() {}

  livre() {}
}

function contexto(
  handler: () => void,
  user?: { id: string; role: Role },
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => RotasDeTeste,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const rotas = RotasDeTeste.prototype;

  it('libera rotas sem @Roles', () => {
    expect(guard.canActivate(contexto(rotas.livre))).toBe(true);
  });

  it('libera o perfil exigido', () => {
    expect(
      guard.canActivate(
        contexto(rotas.comMensagem, { id: 'u', role: Role.ADMINISTRADOR }),
      ),
    ).toBe(true);
  });

  it('usa a mensagem de @RolesMessage quando o perfil não é permitido', () => {
    const chamada = () =>
      guard.canActivate(
        contexto(rotas.comMensagem, { id: 'u', role: Role.EQUIPE_GESTAO }),
      );

    expect(chamada).toThrow(ForbiddenException);
    expect(chamada).toThrow(
      'Você não possui permissão para atualizar o núcleo.',
    );
  });

  it('usa a mensagem genérica quando a rota não define @RolesMessage', () => {
    expect(() =>
      guard.canActivate(
        contexto(rotas.semMensagem, { id: 'u', role: Role.EQUIPE_GESTAO }),
      ),
    ).toThrow('Você não tem permissão para acessar este recurso.');
  });

  it('recusa requisição sem usuário autenticado', () => {
    expect(() => guard.canActivate(contexto(rotas.comMensagem))).toThrow(
      'Usuário não autenticado.',
    );
  });
});
