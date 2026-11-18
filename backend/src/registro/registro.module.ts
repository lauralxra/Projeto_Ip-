import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { RegistroService } from './registro.service';
import { RegistroController } from './registro.controller';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [RegistroController],
  providers: [RegistroService],
})
export class RegistroModule {}
