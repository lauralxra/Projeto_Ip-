import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

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

  async sendEmailChangeConfirmation(to: string, token: string) {
    const link = `${process.env.APP_URL}/confirmar-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"Sistema IPÊ" <${process.env.MAIL_FROM}>`,
        to,
        subject: 'Confirmação de troca de e-mail',
        html: `
          <h2>Confirmação de troca de e-mail</h2>
          <p>Você solicitou a troca do seu e-mail no sistema IPÊ.</p>
          <p>Clique no link abaixo para confirmar:</p>
          <a href="${link}">${link}</a>
          <p>Este link expira em 1 hora.</p>
          <p>Se você não solicitou esta troca, ignore este e-mail.</p>
        `,
      });

      this.logger.log(`E-mail de confirmação enviado para: ${to}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail para ${to}:`, error);
      throw error;
    }
  }
}
