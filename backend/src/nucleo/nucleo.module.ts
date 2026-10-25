import { Module } from '@nestjs/common';
import { NucleoService } from './nucleo.service';
import { NucleoController } from './nucleo.controller';
import { NucleoRepository } from './nucleo.repository';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [NucleoController],
  providers: [NucleoService, NucleoRepository],
})
export class NucleoModule {}
