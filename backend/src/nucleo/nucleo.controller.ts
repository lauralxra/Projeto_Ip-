import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Ip,
  ParseUUIDPipe,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { NucleoService } from './nucleo.service';
import { CreateNucleoDto } from './dto/create-nucleo.dto';
import { SearchNucleoDto } from './dto/search-nucleo.dto';
import { UpdateNucleoDto } from './dto/update-nucleo.dto';
import { CreateNucleoSwagger } from './swagger/nucleo.post.swagger';
import { SearchNucleoSwagger } from './swagger/nucleo.get.swagger';
import { DeleteNucleoSwagger } from './swagger/nucleo.delete.swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import { PrismaExceptionFilter } from '../common/filters/prisma-exception.filter';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';

@ApiTags('nucleo')
@UseFilters(PrismaExceptionFilter)
@Controller('nucleos')
export class NucleoController {
  constructor(private readonly nucleoService: NucleoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @CreateNucleoSwagger()
  create(
    @Body() createNucleoDto: CreateNucleoDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.nucleoService.create(createNucleoDto, { id: req.user.id, ip });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @SearchNucleoSwagger()
  search(@Query() filtros: SearchNucleoDto, @Req() req: AuthenticatedRequest) {
    return this.nucleoService.search(filtros, req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.nucleoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNucleoDto: UpdateNucleoDto) {
    return this.nucleoService.update(+id, updateNucleoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMINISTRADOR)
  @DeleteNucleoSwagger()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.nucleoService.remove(id, { id: req.user.id, ip });
  }
}
