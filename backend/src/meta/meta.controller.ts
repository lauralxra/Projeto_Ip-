import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';
import { MetaService } from './meta.service';
import { CreateMetaDto } from './dto/create-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';

@ApiTags('metas')
@ApiBearerAuth('JWT-auth')
@Controller('meta')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR)
  create(
    @Body() dados: CreateMetaDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.metaService.create(dados, { id: req.user.id, ip });
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.metaService.findAll(req.user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.metaService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: UpdateMetaDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.metaService.update(id, dados, { id: req.user.id, ip });
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.metaService.remove(id, { id: req.user.id, ip });
  }
}
