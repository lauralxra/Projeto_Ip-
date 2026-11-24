import { Role } from '@prisma/client';

// Só access token: sem refresh token e sem e-mail no payload.
export interface JwtPayload {
  sub: string;
  role: Role;
  // Preenchido pelo JwtService ao assinar (segundos desde a época)
  iat?: number;
}
