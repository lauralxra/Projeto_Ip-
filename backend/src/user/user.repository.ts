import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Nunca expõe senhaHash
export const publicUserSelect = {
  id: true,
  nome: true,
  email: true,
  fotoUrl: true, 
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

  findActiveById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: publicUserSelect,
    });
  }

  updateName(id: string, nome: string) {
    return this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { nome },
    });
  }
  updatePermissions(id: string, role: Role) {
    return this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { perfil: role },
    });
  }

  findNucleosByUserId(userId: string) {
    return this.prisma.userNucleo.findMany({
      where: { userId },
      select: { nucleoId: true },
    });
  }

  syncNucleos(userId: string, nucleoIds: string[]) {
    return this.prisma.$transaction([
      this.prisma.userNucleo.deleteMany({ where: { userId } }),
      this.prisma.userNucleo.createMany({
        data: nucleoIds.map((nucleoId) => ({ userId, nucleoId })),
      }),
    ]);

  updatePhoto(id: string, fotoUrl: string) {
  return this.prisma.user.updateMany({
    where: { id, deletedAt: null },
    data: { fotoUrl },
  });
  countAtivos() {
    return this.prisma.user.count({ where: { ativo: true, deletedAt: null } });
  }
}
