import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';
import { RegistroService } from './registro.service';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { FilterRegistroDto } from './dto/filter-registro.dto';
import { DevolverRegistroDto } from './dto/devolver-registro.dto';

// Valores trimestrais dos indicadores. A criação acontece em POST /indicadores/:id/registros.
@ApiTags('registros')
@ApiBearerAuth('JWT-auth')
@Controller('registros')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistroController {
  constructor(private readonly registroService: RegistroService) {}

  @Get()
  findAll(
    @Query() filtros: FilterRegistroDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.registroService.findAll(filtros, req.user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.registroService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR, Role.DIRETORES_NUCLEOS)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: UpdateRegistroDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.registroService.update(id, dados, req.user, ip);
  }

  @Patch(':id/inativar')
  @Roles(Role.ADMINISTRADOR)
  inativar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.registroService.inativar(id, { id: req.user.id, ip });
  }

  @Patch(':id/reativar')
  @Roles(Role.ADMINISTRADOR)
  reativar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.registroService.reativar(id, { id: req.user.id, ip });
  }

  @Patch(':id/enviar-revisao')
  @Roles(Role.ADMINISTRADOR, Role.DIRETORES_NUCLEOS)
  enviarParaRevisao(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.registroService.enviarParaRevisao(id, req.user, ip);
  }

  @Patch(':id/devolver')
  @Roles(Role.ADMINISTRADOR, Role.EQUIPE_GESTAO)
  devolver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: DevolverRegistroDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.registroService.devolverComComentario(id, dados.justificativa, {
      id: req.user.id,
      ip,
    });
  }

  @Patch(':id/aprovar')
  @Roles(Role.ADMINISTRADOR, Role.EQUIPE_GESTAO)
  aprovar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.registroService.aprovar(id, { id: req.user.id, ip });
  }

  @Patch(':id/publicar')
  @Roles(Role.ADMINISTRADOR)
  publicar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.registroService.publicar(id, { id: req.user.id, ip });
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.registroService.remove(id, { id: req.user.id, ip });
  }
}
