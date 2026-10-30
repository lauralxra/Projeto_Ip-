import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NucleoService {
  constructor(private readonly prisma: PrismaService) {}

  listarAtivos() {
    return this.prisma.nucleo.findMany({
      where: {
        status: 'ATIVO',
        deletedAt: null,
      },
      select: {
        id: true,
        nome: true,
        sigla: true,
        descricao: true,
        corHex: true,
        imagemUrl: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }
}