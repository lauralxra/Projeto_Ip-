import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Ip,
  UseGuards,
  ParseUUIDPipe,
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
    return this.programaService.create(dto, req.user.id, ip);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query() filtros: FilterProgramaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.programaService.findAll(filtros, req.user.id);
  }

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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.programaService.findOne(id);
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
    return this.programaService.update(id, dto, req.user.id, ip);
  }
  @Patch(':id/desativar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
desativar(
  @Param('id', ParseUUIDPipe) id: string,
  @Req() req: AuthenticatedRequest,
  @Ip() ip: string,
) {
  return this.programaService.desativar(id, req.user.id, ip);
}

@Patch(':id/arquivar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR)
arquivar(
  @Param('id', ParseUUIDPipe) id: string,
  @Req() req: AuthenticatedRequest,
  @Ip() ip: string,
) {
  return this.programaService.arquivar(id, req.user.id, ip);
}

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.programaService.remove(id, req.user.id, ip);
  }
}