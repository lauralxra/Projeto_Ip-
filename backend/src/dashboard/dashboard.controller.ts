import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { FilterDashboardDto } from './dto/filter-dashboard.dto';
import { DashboardIndicadoresSwagger } from './swagger/dashboard.indicators.swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorators';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';

@ApiTags('dashboard')
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
    @Query() filtros: FilterDashboardDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dashboardService.findIndicadores(filtros, req.user);
  }
}
