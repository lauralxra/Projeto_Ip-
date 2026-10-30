import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { ImportacaoModule } from './importacao/importacao.module';
import { IndicadorModule } from './indicador/indicador.module';
import { ProgramaModule } from './programa/programa.module';
import { NucleoModule } from './nucleo/nucleo.module';

@Module({
  imports: [PrismaModule, UserModule, AuthModule, AuditModule, ImportacaoModule, IndicadorModule, ProgramaModule, NucleoModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


