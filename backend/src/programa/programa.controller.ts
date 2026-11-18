import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProgramaService } from './programa.service';
import { CreateProgramaDto } from './dto/create-programa.dto';
import { UpdateProgramaDto } from './dto/update-programa.dto';
import { FilterProgramaDto } from './dto/filter-programa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';

// RF23: o administrador cadastra, edita e remove programas; os demais perfis consultam
@ApiTags('programas')
@ApiBearerAuth('JWT-auth')
@Controller('programas')
export class ProgramaController {
  constructor(private readonly programaService: ProgramaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  create(
    @Body() dto: CreateProgramaDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.programaService.create(dto, { id: req.user.id, ip });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query() filtros: FilterProgramaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.programaService.findAll(filtros, req.user);
  }

  // Rotas estáticas ficam antes de ':id' para não serem capturadas como identificador
  @Get('contagem')
  @UseGuards(JwtAuthGuard)
  contarAtivos() {
    return this.programaService.contarAtivos();
  }

  @Get('por-nucleo')
  @UseGuards(JwtAuthGuard)
  contarPorNucleo() {
    return this.programaService.contarPorNucleo();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.programaService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgramaDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.programaService.update(id, dto, { id: req.user.id, ip });
  }

  @Patch(':id/desativar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  desativar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.programaService.desativar(id, { id: req.user.id, ip });
  }

  @Patch(':id/arquivar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  arquivar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.programaService.arquivar(id, { id: req.user.id, ip });
  }

  @Patch(':id/reativar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  reativar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.programaService.reativar(id, { id: req.user.id, ip });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.programaService.remove(id, { id: req.user.id, ip });
  }
}
