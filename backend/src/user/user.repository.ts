import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Nunca expõe senhaHash
export const publicUserSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  createdAt: true,
} as const;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Considera apenas usuários não excluídos, igual ao índice único parcial
  findActiveByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data, select: publicUserSelect });
  }
}
