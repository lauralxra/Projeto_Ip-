import {
  Controller,
  Get,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardIndicadoresSwagger } from './swagger/dashboard.indicators.swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import { PrismaExceptionFilter } from '../common/filters/prisma-exception.filter';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';

@ApiTags('dashboard')
@UseFilters(PrismaExceptionFilter)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Todos os perfis acessam; o que cada um enxerga é filtrado no service
  @Get('indicators')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMINISTRADOR,
    Role.DIRETORES_NUCLEOS,
    Role.EQUIPE_GESTAO,
    Role.EQUIPE_COMUNICACAO,
  )
  @DashboardIndicadoresSwagger()
  findIndicadores(
    @Query() filtros: DashboardQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dashboardService.findIndicadores(filtros, req.user);
  }
}
