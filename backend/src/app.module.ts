import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { NucleoModule } from './nucleo/nucleo.module';
import { ProgramaModule } from './programa/programa.module';
import { AcaoModule } from './acao/acao.module';
import { IndicadorModule } from './indicador/indicador.module';
import { MetaModule } from './meta/meta.module';
import { PeriodoColetaModule } from './periodo-coleta/periodo-coleta.module';
import { RegistroModule } from './registro/registro.module';
import { ImportacaoModule } from './importacao/importacao.module';
import { NotificacaoModule } from './notificacao/notificacao.module';
import { ForumModule } from './forum/forum.module';
import { FaqModule } from './faq/faq.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    AuditModule,
    NucleoModule,
    ProgramaModule,
    AcaoModule,
    IndicadorModule,
    MetaModule,
    PeriodoColetaModule,
    RegistroModule,
    ImportacaoModule,
    NotificacaoModule,
    ForumModule,
    FaqModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // RNF16: tratamento padronizado de erros do banco em todos os endpoints da API
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
