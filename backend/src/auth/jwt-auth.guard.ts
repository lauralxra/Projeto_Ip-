import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedRequest } from './interface/request.interface';
import { JwtPayload } from './interface/jwt-payload.interface';
import { IS_PUBLIC_KEY } from './public.decorator';

// Valida o Bearer token e preenche request.user para o RolesGuard.
// Registrado como guard global: toda rota exige token, exceto as marcadas com @Public().
// Também recusa tokens emitidos antes de users.sessoes_invalidadas_em (ex.: senha
// recuperada), já que o JWT sozinho continuaria válido até expirar.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Optional() private readonly reflector?: Reflector,
    @Optional() private readonly prisma?: PrismaService,
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

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado.');
    }

    if (await this.sessaoEncerrada(payload)) {
      throw new UnauthorizedException(
        'Sessão encerrada. Faça login novamente.',
      );
    }

    request.user = { id: payload.sub, role: payload.role };
    return true;
  }

  private async sessaoEncerrada(payload: JwtPayload): Promise<boolean> {
    if (!this.prisma) return false;

    const usuario = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { sessoesInvalidadasEm: true },
    });
    if (!usuario) return true;
    if (!usuario.sessoesInvalidadasEm) return false;

    // iat está em segundos; tokens do mesmo segundo da invalidação ou depois valem
    const emitidoEm = (payload.iat ?? 0) * 1000;
    const invalidadoEm =
      Math.floor(usuario.sessoesInvalidadasEm.getTime() / 1000) * 1000;
    return emitidoEm < invalidadoEm;
  }
}
