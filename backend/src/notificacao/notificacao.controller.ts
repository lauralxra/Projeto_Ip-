import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  Ip,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { NotificacaoService } from './notificacao.service';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';

@ApiTags('notificacoes')
@ApiBearerAuth('JWT-auth')
@Controller('notificacoes')
export class NotificacaoController {
  constructor(private readonly notificacaoService: NotificacaoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  create(
    @Body() dto: CreateNotificacaoDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.notificacaoService.create(dto, req.user.id, ip);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findMinhas(@Req() req: AuthenticatedRequest) {
    return this.notificacaoService.findByUsuario(req.user.id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  findAll() {
    return this.notificacaoService.findAll();
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  marcarTodasLidas(@Req() req: AuthenticatedRequest) {
    return this.notificacaoService.marcarTodasComoLidas(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  marcarLida(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificacaoService.marcarComoLida(id, req.user.id);
  }
}