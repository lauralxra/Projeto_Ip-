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

export const nucleoAssociadoSelect = {
  id: true,
  nome: true,
  sigla: true,
  imagemUrl: true,
} as const;

@Injectable()
export class NucleoRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Nome e sigla são únicos apenas entre núcleos não excluídos.
  // Na edição, `ignorarId` desconsidera o próprio núcleo.
  findConflito(nome: string, sigla: string, ignorarId?: string) {
    return this.prisma.nucleo.findFirst({
      where: {
        deletedAt: null,
        ...(ignorarId && { id: { not: ignorarId } }),
        OR: [
          { nome: { equals: nome, mode: 'insensitive' } },
          { sigla: { equals: sigla, mode: 'insensitive' } },
        ],
      },
      select: { nome: true, sigla: true },
    });
  }

  // Página de resultados e total na mesma transação, para a contagem bater com os itens
  search(where: Prisma.NucleoWhereInput, skip: number, take: number) {
    return this.prisma.$transaction([
      this.prisma.nucleo.findMany({
        where,
        select: nucleoSelect,
        orderBy: { nome: 'asc' },
        skip,
        take,
      }),
      this.prisma.nucleo.count({ where }),
    ]);
  }

  findAtivoById(id: string) {
    return this.prisma.nucleo.findFirst({
      where: { id, deletedAt: null },
      select: nucleoSelect,
    });
  }

  async usuarioVinculado(nucleoId: string, userId: string) {
    const vinculo = await this.prisma.userNucleo.findUnique({
      where: { userId_nucleoId: { userId, nucleoId } },
      select: { nucleoId: true },
    });
    return vinculo !== null;
  }

  findAssociadosByUserId(userId: string) {
    return this.prisma.nucleo.findMany({
      where: {
        deletedAt: null,
        users: { some: { userId } },
      },
      select: nucleoAssociadoSelect,
      orderBy: { nome: 'asc' },
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
            // Usuários excluídos não impedem a exclusão (inclui vínculos antigos,
            // anteriores à remoção automática na exclusão do usuário)
            users: { where: { user: { deletedAt: null } } },
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

  async updateDados(id: string, data: Prisma.NucleoUpdateManyMutationInput) {
    const { count } = await this.prisma.nucleo.updateMany({
      where: { id, deletedAt: null },
      data,
    });
    return count > 0;
  }

  async updateImagem(id: string, imagemUrl: string) {
    const { count } = await this.prisma.nucleo.updateMany({
      where: { id, deletedAt: null },
      data: { imagemUrl },
    });
    return count > 0;
  }

  // Desativação mantém o núcleo e seus vínculos; não altera deletedAt.
  async deactivate(id: string) {
    const { count } = await this.prisma.nucleo.updateMany({
      where: { id, deletedAt: null, status: 'ATIVO' },
      data: { status: 'INATIVO' },
    });
    return count > 0;
  }
}
