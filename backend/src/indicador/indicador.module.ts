import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { IndicadorController } from './indicador.controller';
import { IndicadorService } from './indicador.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [IndicadorController],
  providers: [IndicadorService],
})
export class IndicadorModule {}
