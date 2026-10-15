import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RegistroTentativaLogin {
  email: string;
  sucesso: boolean;
  userId?: string | null;
  ip: string;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  // Chamado pelo AuthService, nunca por um endpoint público
  registrarTentativaLogin(dados: RegistroTentativaLogin) {
    return this.prisma.loginLog.create({
      data: {
        emailTentado: dados.email,
        sucesso: dados.sucesso,
        userId: dados.userId ?? null,
        ipOrigem: dados.ip,
        userAgent: dados.userAgent ?? null,
      },
    });
  }
}
