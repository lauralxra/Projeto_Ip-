import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { IndicadorService } from './indicador.service';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
import { SalvarRegistroDto } from './dto/salvar-registro.dto';
import {
  CreateIndicadorSwagger,
  FindAllIndicadoresSwagger,
  RemoveIndicadorSwagger,
  SalvarRegistroSwagger,
} from './swagger/indicador.swagger';

@ApiTags('indicadores')
@ApiBearerAuth('JWT-auth')
@Controller('indicadores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndicadorController {
  constructor(private readonly indicadorService: IndicadorService) {}

  @Get()
  @FindAllIndicadoresSwagger()
  findAll(
    @Req() req: AuthenticatedRequest,
    // Só a Administração recebe os inativos; para os demais o parâmetro é ignorado
    @Query('incluirInativos', new ParseBoolPipe({ optional: true }))
    incluirInativos?: boolean,
  ) {
    return this.indicadorService.findAll(req.user, incluirInativos ?? false);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: UpdateIndicadorDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.indicadorService.update(id, dados, { id: req.user.id, ip });
  }

  @Post()
  @Roles(Role.ADMINISTRADOR)
  @CreateIndicadorSwagger()
  create(
    @Body() dados: CreateIndicadorDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.indicadorService.create(dados, { id: req.user.id, ip });
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  @RemoveIndicadorSwagger()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.indicadorService.remove(id, { id: req.user.id, ip });
  }

  @Post(':id/registros')
  @Roles(Role.ADMINISTRADOR, Role.DIRETORES_NUCLEOS)
  @SalvarRegistroSwagger()
  salvarRegistro(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: SalvarRegistroDto,
    @Req() req: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.indicadorService.salvarRegistro(id, dados, req.user, ip);
  }
}
