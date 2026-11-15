import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  async sendPasswordChanged(to: string): Promise<void> {
  await this.transporter.sendMail({
    from: `"Sistema IPÊ" <${process.env.MAIL_FROM}>`,
    to,
    subject: 'Sua senha foi alterada',
    html: `
      <h2>Aviso de segurança</h2>
      <p>Sua senha foi alterada com sucesso no sistema IPÊ.</p>
      <p>Se você não realizou essa alteração, entre em contato imediatamente com o administrador do sistema.</p>
    `,
  });
  this.logger.log(`E-mail de alteração de senha enviado para: ${to}`);
  }
}