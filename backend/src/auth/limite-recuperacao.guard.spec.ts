import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import {
  LIMITE_RECUPERACAO_JANELA_MS,
  LIMITE_RECUPERACAO_REQUISICOES,
  LimiteRecuperacaoGuard,
} from './limite-recuperacao.guard';

describe('LimiteRecuperacaoGuard', () => {
  const contexto = (ip: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ ip }) }),
    }) as unknown as ExecutionContext;

  afterEach(() => {
    jest.useRealTimers();
  });

  it('libera até o limite e responde 429 a partir daí, só para o mesmo IP', () => {
    const guard = new LimiteRecuperacaoGuard();

    for (let i = 0; i < LIMITE_RECUPERACAO_REQUISICOES; i++) {
      expect(guard.canActivate(contexto('203.0.113.7'))).toBe(true);
    }

    const erro = (() => {
      try {
        guard.canActivate(contexto('203.0.113.7'));
      } catch (e) {
        return e as HttpException;
      }
    })();
    expect(erro?.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);

    // Outro IP não é afetado
    expect(guard.canActivate(contexto('198.51.100.1'))).toBe(true);
  });

  it('volta a liberar quando a janela de tempo passa', () => {
    jest.useFakeTimers();
    const guard = new LimiteRecuperacaoGuard();

    for (let i = 0; i < LIMITE_RECUPERACAO_REQUISICOES; i++) {
      guard.canActivate(contexto('203.0.113.7'));
    }
    expect(() => guard.canActivate(contexto('203.0.113.7'))).toThrow(
      HttpException,
    );

    jest.advanceTimersByTime(LIMITE_RECUPERACAO_JANELA_MS + 1);
    expect(guard.canActivate(contexto('203.0.113.7'))).toBe(true);
  });
});
