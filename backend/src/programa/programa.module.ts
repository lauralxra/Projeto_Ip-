import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { ProgramaService } from './programa.service';
import { ProgramaController } from './programa.controller';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ProgramaController],
  providers: [ProgramaService],
})
export class ProgramaModule {}