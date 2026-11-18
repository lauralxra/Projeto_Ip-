import { Module } from '@nestjs/common';
import { NotificacaoService } from './notificacao.service';
import { NotificacaoController } from './notificacao.controller';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../mail/mail.module';

// PrismaModule é global e ScheduleModule.forRoot() fica no AppModule
@Module({
  imports: [AuditModule, MailModule],
  controllers: [NotificacaoController],
  providers: [NotificacaoService],
  // UserModule usa o aviso de troca de senha
  exports: [NotificacaoService],
})
export class NotificacaoModule {}
