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

  updateDados(id: string, data: { nome?: string; email?: string }) {
    return this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data,
    });
  }

  updateEmail(id: string, email: string) {
    return this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { email },
    });
  }

  updateStatus(id: string, ativo: boolean) {
    return this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { ativo },
    });
  }

  // `client` permite rodar dentro de uma transação aberta pelo serviço
  updatePermissions(
    id: string,
    role: Role,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    return client.user.updateMany({
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

  // Troca todos os vínculos do usuário. Deve rodar dentro de uma transação
  // (o serviço passa o `client` dela) para não deixar o usuário sem núcleos
  // caso a criação falhe depois da remoção
  async syncNucleos(
    userId: string,
    nucleoIds: string[],
    client: Prisma.TransactionClient,
  ) {
    await client.userNucleo.deleteMany({ where: { userId } });
    if (nucleoIds.length > 0) {
      await client.userNucleo.createMany({
        data: nucleoIds.map((nucleoId) => ({ userId, nucleoId })),
      });
    }
  }

  updatePhoto(id: string, fotoUrl: string) {
    return this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { fotoUrl },
    });
  }

  countAtivos() {
    return this.prisma.user.count({ where: { ativo: true, deletedAt: null } });
  }

  // Exclusão lógica: preserva o histórico e a rastreabilidade (RN07)
  // Exclusão lógica e remoção dos vínculos (núcleos e programas) na mesma
  // transação: um usuário excluído não pode continuar impedindo a exclusão do
  // núcleo nem aparecer como responsável ou participante de programa.
  // Devolve o que foi desvinculado, para a auditoria.
  softDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date(), ativo: false },
      });
      if (count === 0) {
        return {
          count,
          nucleoIds: [] as string[],
          programasParticipante: [] as string[],
          programasResponsavel: [] as string[],
        };
      }

      const vinculos = await tx.userNucleo.findMany({
        where: { userId: id },
        select: { nucleoId: true },
      });
      await tx.userNucleo.deleteMany({ where: { userId: id } });

      // Também sai dos programas: deixa de ser participante e responsável
      const participacoes = await tx.programaParticipante.findMany({
        where: { userId: id },
        select: { programaId: true },
      });
      await tx.programaParticipante.deleteMany({ where: { userId: id } });
      const responsavelPor = await tx.programa.findMany({
        where: { responsavelId: id },
        select: { id: true },
      });
      await tx.programa.updateMany({
        where: { responsavelId: id },
        data: { responsavelId: null },
      });

      return {
        count,
        nucleoIds: vinculos.map((v) => v.nucleoId),
        programasParticipante: participacoes.map((p) => p.programaId),
        programasResponsavel: responsavelPor.map((p) => p.id),
      };
    });
  }

  // Único método que lê o hash: usado só para conferir a senha atual
  findActiveWithPasswordById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, nome: true, email: true, senhaHash: true },
    });
  }

  updatePassword(id: string, senhaHash: string) {
    return this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { senhaHash },
    });
  }
}
