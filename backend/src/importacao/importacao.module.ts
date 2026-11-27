import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { ImportacaoController } from './importacao.controller';
import { ImportacaoService } from './importacao.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [ImportacaoController],
  providers: [ImportacaoService],
})
export class ImportacaoModule {}
