import { Module } from '@nestjs/common';
import { NotificacaoService } from './notificacao.service';
import { NotificacaoController } from './notificacao.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [NotificacaoController],
  providers: [NotificacaoService],
  exports: [NotificacaoService],
})
export class NotificacaoModule {}
