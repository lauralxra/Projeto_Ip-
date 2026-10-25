import { Injectable } from '@nestjs/common';
import { AcaoAuditoria, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface RegistroTentativaLogin {
  email: string;
  sucesso: boolean;
  userId?: string | null;
  ip: string;
  userAgent?: string | null;
}

export interface RegistroAcao {
  userId: string | null;
  acao: AcaoAuditoria;
  entidade: string;
  entidadeId: string;
  dadosAntigos?: Prisma.InputJsonValue;
  dadosNovos?: Prisma.InputJsonValue;
  ip?: string | null;
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

  // Grava em audit_logs; a tabela é imutável (trigger em migration_extra.sql)
  registrarAcao(dados: RegistroAcao) {
    return this.prisma.auditLog.create({
      data: {
        userId: dados.userId,
        acao: dados.acao,
        entidade: dados.entidade,
        entidadeId: dados.entidadeId,
        dadosAntigos: dados.dadosAntigos,
        dadosNovos: dados.dadosNovos,
        ipOrigem: dados.ip ?? null,
      },
    });
  }
}
