import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgramaService {
  constructor(private readonly prisma: PrismaService) {}

    listarAtivos() {
        return this.prisma.programa.findMany({
        where: {
            status: 'ATIVO',
            deletedAt: null,
        },
        select: {
            id: true,
            nome: true,
            descricao: true,
            nucleoId: true,
            nucleo: {
            select: {
                id: true,
                nome: true,
                sigla: true,
            },
            },
        },
        orderBy: {
            nome: 'asc',
        },
        });
    }

  contarAtivos() {
    return this.prisma.programa.count({
      where: {
        status: 'ATIVO',
        deletedAt: null,
      },
    });
  }

  contarPorNucleo() {
    return this.prisma.programa.groupBy({
      by: ['nucleoId'],
      where: {
        status: 'ATIVO',
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });
  }
}