import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { MetaService } from './meta.service';
import { MetaController } from './meta.controller';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [MetaController],
  providers: [MetaService],
})
export class MetaModule {}
