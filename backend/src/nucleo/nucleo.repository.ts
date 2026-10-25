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

  create(data: Prisma.NucleoCreateInput) {
    return this.prisma.nucleo.create({ data, select: nucleoSelect });
  }
}
