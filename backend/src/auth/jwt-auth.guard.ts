import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Role } from '@prisma/client';

interface RequestComUsuario extends Request {
  user?: { id: string; role: Role };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestComUsuario>();
    const authorization = request.headers.authorization;
    const [tipo, token] = authorization?.split(' ') ?? [];

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token de acesso ausente ou inválido.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        role: Role;
      }>(token);

      if (!payload.sub || !Object.values(Role).includes(payload.role)) {
        throw new UnauthorizedException('Token inválido.');
      }

      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }
}
