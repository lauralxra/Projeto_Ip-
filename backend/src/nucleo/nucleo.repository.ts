import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const nucleoSelect = {
  id: true,
  nome: true,
  sigla: true,
  descricao: true,
  corHex: true,
  imagemUrl: true,
  status: true,
  createdAt: true,
} as const;

@Injectable()
export class NucleoRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Nome e sigla são únicos apenas entre núcleos não excluídos
  findConflito(nome: string, sigla: string) {
    return this.prisma.nucleo.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { nome: { equals: nome, mode: 'insensitive' } },
          { sigla: { equals: sigla, mode: 'insensitive' } },
        ],
      },
      select: { nome: true, sigla: true },
    });
  }

  // Núcleos excluídos logicamente (UC027) não aparecem nas consultas
  findAllAtivos() {
    return this.prisma.nucleo.findMany({
      where: { deletedAt: null },
      select: nucleoSelect,
      orderBy: { nome: 'asc' },
    });
  }

  findAtivoById(id: string) {
    return this.prisma.nucleo.findFirst({
      where: { id, deletedAt: null },
      select: nucleoSelect,
    });
  }

  create(data: Prisma.NucleoCreateInput) {
    return this.prisma.nucleo.create({ data, select: nucleoSelect });
  }

  // Conta apenas vínculos vigentes: programas e indicadores excluídos não impedem a exclusão
  findAtivoComVinculos(id: string) {
    return this.prisma.nucleo.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...nucleoSelect,
        _count: {
          select: {
            users: true,
            programas: { where: { deletedAt: null } },
            indicadores: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  // Exclusão lógica (UC027); o filtro em deletedAt evita excluir duas vezes em requisições concorrentes
  async softDelete(id: string) {
    const { count } = await this.prisma.nucleo.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  }
}
