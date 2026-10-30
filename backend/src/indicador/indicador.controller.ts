
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  Role,
  EscopoIndicador,
  TipoDadoIndicador,
} from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import { PrismaService } from '../prisma/prisma.service';

interface RequestComUsuario extends Request {
  user: { id: string; role: Role };
}

interface CriarIndicadorDto {
  nome: string;
  descricao?: string;
  unidadeMedida?: string;
  escopo: EscopoIndicador;
  tipoDado?: TipoDadoIndicador;
  nucleoId?: string;
  programaId?: string;
  codigo?: string;
}

@Controller('indicadores')
@UseGuards(JwtAuthGuard)
export class IndicadorController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Req() req: RequestComUsuario) {
    const { id, role } = req.user;

    let filtroNucleos: string[] | undefined;

    if (role !== Role.ADMINISTRADOR) {
      const vinculos = await this.prisma.userNucleo.findMany({
        where: { userId: id },
        select: { nucleoId: true },
      });
      filtroNucleos = vinculos.map((v) => v.nucleoId);
    }

    return this.prisma.indicador.findMany({
      where: {
        deletedAt: null,
        status: 'ATIVO',
        ...(filtroNucleos === undefined
          ? {}
          : {
              OR: [
                { escopo: 'INSTITUCIONAL' },
                { nucleoId: { in: filtroNucleos } },
              ],
            }),
      },
      include: {
        nucleo: { select: { id: true, nome: true, sigla: true } },
        programa: { select: { id: true, nome: true } },
        registros: {
          where: { deletedAt: null, status: 'ATIVO' },
          orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }],
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  async create(@Body() dados: CriarIndicadorDto) {
    const nome = dados.nome?.trim();

    if (!nome) {
      throw new BadRequestException('O nome do indicador é obrigatório.');
    }

    if (
      !Object.values(EscopoIndicador).includes(dados.escopo)
    ) {
      throw new BadRequestException('Escopo inválido.');
    }

    if (
      dados.tipoDado &&
      !Object.values(TipoDadoIndicador).includes(dados.tipoDado)
    ) {
      throw new BadRequestException('Tipo de dado inválido.');
    }

    if (dados.escopo === EscopoIndicador.NUCLEO && !dados.nucleoId) {
      throw new BadRequestException(
        'É obrigatório selecionar um núcleo para este indicador.',
      );
    }

    if (dados.escopo === EscopoIndicador.INSTITUCIONAL && dados.nucleoId) {
      throw new BadRequestException(
        'Indicadores institucionais não devem ter núcleo vinculado.',
      );
    }

    if (dados.nucleoId) {
      const nucleo = await this.prisma.nucleo.findFirst({
        where: {
          id: dados.nucleoId,
          deletedAt: null,
          status: 'ATIVO',
        },
      });

      if (!nucleo) {
        throw new BadRequestException('Núcleo não encontrado ou inativo.');
      }
    }

    if (dados.programaId) {
      const programa = await this.prisma.programa.findFirst({
        where: {
          id: dados.programaId,
          deletedAt: null,
          status: 'ATIVO',
          ...(dados.nucleoId ? { nucleoId: dados.nucleoId } : {}),
        },
      });

      if (!programa) {
        throw new BadRequestException(
          'Programa não encontrado, inativo ou incompatível com o núcleo.',
        );
      }
    }

    return this.prisma.indicador.create({
      data: {
        nome,
        descricao: dados.descricao?.trim() || null,
        unidadeMedida: dados.unidadeMedida?.trim() || null,
        escopo: dados.escopo,
        tipoDado: dados.tipoDado ?? TipoDadoIndicador.NUMERICO,
        nucleoId: dados.nucleoId || null,
        programaId: dados.programaId || null,
        codigo: dados.codigo?.trim() || null,
      },
      include: {
        nucleo: { select: { id: true, nome: true, sigla: true } },
        programa: { select: { id: true, nome: true } },
        registros: true,
      },
    });
  }
    @Post(':id/registros')
  async salvarRegistro(
    @Req() req: RequestComUsuario,
    @Body()
    dados: {
      ano: number;
      trimestre: string;
      valorRealizado: number;
    },
  ) {
    const indicador = await this.prisma.indicador.findFirst({
      where: {
        id: String(req.params['id']),
        deletedAt: null,
        status: 'ATIVO',
      },
    });

    if (!indicador) {
      throw new BadRequestException('Indicador não encontrado ou inativo.');
    }

    const ano = Number(dados.ano);
    const valor = Number(dados.valorRealizado);
    const trimestres = ['Q1', 'Q2', 'Q3', 'Q4'];

    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
      throw new BadRequestException('Ano inválido.');
    }

    if (!trimestres.includes(dados.trimestre)) {
      throw new BadRequestException('Trimestre inválido.');
    }

    if (!Number.isFinite(valor) || valor < 0) {
      throw new BadRequestException('Valor realizado inválido.');
    }

    const existente = await this.prisma.indicadorRegistro.findFirst({
      where: {
        indicadorId: indicador.id,
        ano,
        trimestre: dados.trimestre as any,
        deletedAt: null,
      },
    });

    const registro = existente
      ? await this.prisma.indicadorRegistro.update({
          where: { id: existente.id },
          data: {
            valorRealizado: valor,
            responsavelId: req.user.id,
          },
        })
      : await this.prisma.indicadorRegistro.create({
          data: {
            indicadorId: indicador.id,
            ano,
            trimestre: dados.trimestre as any,
            valorRealizado: valor,
            responsavelId: req.user.id,
          },
        });

    return registro;
  }
}
