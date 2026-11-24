import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuditService } from './audit.service';
import { FilterAuditDto } from './dto/filter-audit.dto';
import { Roles } from '../auth/roles.decorators';

@ApiTags('audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.EQUIPE_GESTAO)
  @ApiOperation({ summary: 'Consultar logs de auditoria do sistema' })
  findAll(@Query() filtros: FilterAuditDto) {
    return this.auditService.findAll(filtros);
  }
}
