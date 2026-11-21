import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

export const LIMITE_RECUPERACAO_REQUISICOES = 20;
export const LIMITE_RECUPERACAO_JANELA_MS = 15 * 60 * 1000;

// UC02: limita por IP as rotas públicas de recuperação de senha. Complementa o
// limite por conta do AuthService: aqui o alvo é quem varre vários e-mails ou
// sobrecarrega o servidor (cada pedido calcula um hash bcrypt).
// Guarda em memória: vale por instância do backend e zera ao reiniciar.
@Injectable()
export class LimiteRecuperacaoGuard implements CanActivate {
  private readonly acessos = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const chave = request.ip ?? request.socket?.remoteAddress ?? 'desconhecido';
    const agora = Date.now();
    const inicioJanela = agora - LIMITE_RECUPERACAO_JANELA_MS;

    const recentes = (this.acessos.get(chave) ?? []).filter(
      (t) => t > inicioJanela,
    );

    if (recentes.length >= LIMITE_RECUPERACAO_REQUISICOES) {
      this.acessos.set(chave, recentes);
      throw new HttpException(
        'Muitas solicitações de recuperação de senha. Tente novamente em alguns minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentes.push(agora);
    this.acessos.set(chave, recentes);
    this.limparAntigos(inicioJanela);
    return true;
  }

  // Evita que o mapa cresça sem limite com IPs que não voltam
  private limparAntigos(inicioJanela: number) {
    if (this.acessos.size < 1000) return;
    for (const [chave, tempos] of this.acessos) {
      if (tempos[tempos.length - 1] <= inicioJanela) this.acessos.delete(chave);
    }
  }
}
