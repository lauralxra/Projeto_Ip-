import { Injectable } from '@nestjs/common';
import { AcaoAuditoria, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import { FilterAuditDto } from './dto/filter-audit.dto';

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

  // Grava em audit_logs; a tabela é imutável (trigger na migration 20261117120000_unicidade_parcial_e_restricoes)
  // `client` permite gravar dentro de um $transaction do chamador
  registrarAcao(
    dados: RegistroAcao,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    return client.auditLog.create({
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

  async findAll(filtros?: FilterAuditDto) {
    const where: Prisma.AuditLogWhereInput = {};

    if (filtros?.entidade) {
      where.entidade = { equals: filtros.entidade, mode: 'insensitive' };
    }

    if (filtros?.acao) {
      where.acao = filtros.acao;
    }

    if (filtros?.dataInicio || filtros?.dataFim) {
      where.createdAt = {
        ...(filtros.dataInicio && { gte: new Date(filtros.dataInicio) }),
        ...(filtros.dataFim && { lte: new Date(filtros.dataFim) }),
      };
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
            fotoUrl: true,
            nucleos: {
              select: {
                nucleo: {
                  select: {
                    id: true,
                    nome: true,
                    sigla: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filtros?.limite ? Math.min(filtros.limite, 500) : 100,
    });
  }
}
