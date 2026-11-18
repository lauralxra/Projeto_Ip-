import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { NotificacaoService } from './notificacao.service';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import { ListNotificacaoDto } from './dto/list-notificacao.dto';
import { Roles } from '../auth/roles.decorators';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';

// JwtAuthGuard e RolesGuard são globais (AuthModule): toda rota exige token,
// e as marcadas com @Roles exigem também o perfil.
@ApiTags('notificacoes')
@ApiBearerAuth('JWT-auth')
@Controller('notificacoes')
export class NotificacaoController {
  constructor(private readonly notificacaoService: NotificacaoService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR)
  create(
    @Body() dto: CreateNotificacaoDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.notificacaoService.create(dto, req.user.id, ip);
  }

  @Get()
  findMinhas(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListNotificacaoDto,
  ) {
    return this.notificacaoService.findByUsuario(req.user.id, query);
  }

  @Get('admin')
  @Roles(Role.ADMINISTRADOR)
  findAll(@Query() query: ListNotificacaoDto) {
    return this.notificacaoService.findAll(query);
  }

  @Patch('read-all')
  marcarTodasLidas(@Req() req: AuthenticatedRequest) {
    return this.notificacaoService.marcarTodasComoLidas(req.user.id);
  }

  @Patch(':id/read')
  marcarLida(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificacaoService.marcarComoLida(id, req.user.id);
  }
}
