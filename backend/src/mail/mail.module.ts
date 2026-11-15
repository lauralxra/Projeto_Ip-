import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

// Não é global: importe o MailModule no módulo que precisar enviar e-mails
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
