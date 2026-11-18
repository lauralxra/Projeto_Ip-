import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest } from './interface/request.interface';
import { JwtPayload } from './interface/jwt-payload.interface';
import { IS_PUBLIC_KEY } from './public.decorator';

// Valida o Bearer token e preenche request.user para o RolesGuard.
// Registrado como guard global: toda rota exige token, exceto as marcadas com @Public().
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Optional() private readonly reflector?: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector?.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token de acesso não informado.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado.');
    }

    return true;
  }
}
