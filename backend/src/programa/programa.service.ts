import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramaDto } from './dto/create-programa.dto';
import { UpdateProgramaDto } from './dto/update-programa.dto';
import { FilterProgramaDto } from './dto/filter-programa.dto';
import { AuditService } from '../audit/audit.service';
import { AcaoAuditoria } from '@prisma/client';

@Injectable()
export class ProgramaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateProgramaDto, autorId: string, ip: string) {
    if (dto.nucleoId) {
      const nucleo = await this.prisma.nucleo.findUnique({
        where: { id: dto.nucleoId },
      });
      if (!nucleo || nucleo.deletedAt) {
        throw new NotFoundException('Núcleo não encontrado.');
      }
    }

    const programa = await this.prisma.programa.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        nucleoId: dto.nucleoId,
      },
    });

    await this.audit.registrarAcao({
      userId: autorId,
      acao: AcaoAuditoria.CRIAR,
      entidade: 'Programa',
      entidadeId: programa.id,
      dadosNovos: { nome: programa.nome },
      ip,
    });

    return programa;
  }

  async findAll(filtros: FilterProgramaDto, userId: string) {
    const where: Record<string, unknown> = {
      status: 'ATIVO',
      deletedAt: null,
    };

    if (filtros.nome) {
      where.nome = { contains: filtros.nome, mode: 'insensitive' };
    }

    if (filtros.nucleoId) {
      where.nucleoId = filtros.nucleoId;
    }

    const programas = await this.prisma.programa.findMany({
      where,
      select: {
        id: true,
        nome: true,
        descricao: true,
        nucleoId: true,
        status: true,
        nucleo: { select: { id: true, nome: true, sigla: true } },
        createdAt: true,
      },
      orderBy: { nome: 'asc' },
    });

    return {
      itens: programas,
      total: programas.length,
    };
  }

  async findOne(id: string) {
    const programa = await this.prisma.programa.findUnique({
      where: { id },
      include: {
        nucleo: { select: { id: true, nome: true, sigla: true } },
        acoes: { where: { deletedAt: null }, select: { id: true, nome: true } },
      },
    });

    if (!programa || programa.deletedAt) {
      throw new NotFoundException('Programa não encontrado.');
    }

    return programa;
  }

  async update(id: string, dto: UpdateProgramaDto, autorId: string, ip: string) {
    const programa = await this.prisma.programa.findUnique({ where: { id } });
    if (!programa || programa.deletedAt) {
      throw new NotFoundException('Programa não encontrado.');
    }

    const atualizado = await this.prisma.programa.update({
      where: { id },
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        nucleoId: dto.nucleoId,
      },
    });

    await this.audit.registrarAcao({
      userId: autorId,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Programa',
      entidadeId: id,
      dadosAntigos: { nome: programa.nome },
      dadosNovos: { nome: atualizado.nome },
      ip,
    });

    return atualizado;
  }

  async desativar(id: string, autorId: string, ip: string) {
    const programa = await this.prisma.programa.findUnique({ where: { id } });
    if (!programa || programa.deletedAt) {
      throw new NotFoundException('Programa não encontrado.');
    }

    await this.prisma.programa.update({
      where: { id },
      data: { status: 'INATIVO' },
    });

    await this.audit.registrarAcao({
      userId: autorId,
      acao: AcaoAuditoria.DESATIVAR,
      entidade: 'Programa',
      entidadeId: id,
      dadosAntigos: { status: programa.status },
      dadosNovos: { status: 'INATIVO' },
      ip,
    });

    return { message: 'Programa desativado com sucesso.' };
  }

  async arquivar(id: string, autorId: string, ip: string) {
    const programa = await this.prisma.programa.findUnique({ where: { id } });
    if (!programa || programa.deletedAt) {
      throw new NotFoundException('Programa não encontrado.');
    }

    await this.prisma.programa.update({
      where: { id },
      data: { status: 'ARQUIVADO' },
    });

    await this.audit.registrarAcao({
      userId: autorId,
      acao: AcaoAuditoria.ARQUIVAR,
      entidade: 'Programa',
      entidadeId: id,
      dadosAntigos: { status: programa.status },
      dadosNovos: { status: 'ARQUIVADO' },
      ip,
    });

    return { message: 'Programa arquivado com sucesso.' };
  }

  async remove(id: string, autorId: string, ip: string) {
    const programa = await this.prisma.programa.findUnique({ where: { id } });
    if (!programa || programa.deletedAt) {
      throw new NotFoundException('Programa não encontrado.');
    }

    await this.prisma.programa.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INATIVO' },
    });

    await this.audit.registrarAcao({
      userId: autorId,
      acao: AcaoAuditoria.EXCLUIR_LOGICO,
      entidade: 'Programa',
      entidadeId: id,
      dadosAntigos: { nome: programa.nome },
      ip,
    });

    return { message: 'Programa removido com sucesso.' };
  }

  listarAtivos() {
    return this.prisma.programa.findMany({
      where: { status: 'ATIVO', deletedAt: null },
      select: {
        id: true,
        nome: true,
        descricao: true,
        nucleoId: true,
        nucleo: { select: { id: true, nome: true, sigla: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  contarAtivos() {
    return this.prisma.programa.count({ where: { status: 'ATIVO', deletedAt: null } });
  }

  contarPorNucleo() {
    return this.prisma.programa.groupBy({
      by: ['nucleoId'],
      where: { status: 'ATIVO', deletedAt: null },
      _count: { id: true },
    });
  }
}