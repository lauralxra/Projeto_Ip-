import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

export interface EnviarEmail {
  to: string | string[];
  subject: string;
  html: string;
  // Versão em texto puro para clientes que não exibem HTML
  text?: string;
}

const PORTA_PADRAO = 587;
// Na 465 a conexão já começa com TLS; nas demais (587, 25) o STARTTLS é negociado depois
const PORTA_SSL = 465;
const VARIAVEIS_OBRIGATORIAS = [
  'MAIL_HOST',
  'MAIL_USER',
  'MAIL_PASS',
  'MAIL_FROM',
] as const;

// Serviço compartilhado de envio de e-mails: os módulos que enviam e-mail importam o MailModule
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly remetente: string;

  constructor() {
    const port = Number(process.env.MAIL_PORT) || PORTA_PADRAO;

    this.remetente = `"Sistema IPÊ" <${process.env.MAIL_FROM}>`;
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port,
      secure: port === PORTA_SSL,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  // Avisa na inicialização se o SMTP não estiver configurado, em vez de falhar só no primeiro envio
  onModuleInit() {
    const ausentes = VARIAVEIS_OBRIGATORIAS.filter(
      (variavel) => !process.env[variavel],
    );

    if (ausentes.length > 0) {
      this.logger.warn(
        `Envio de e-mails não configurado. Defina: ${ausentes.join(', ')}.`,
      );
      return;
    }

    // Sem await: um SMTP lento ou fora do ar não deve atrasar a subida da API
    void this.verificarConexao();
  }

  async sendMail({ to, subject, html, text }: EnviarEmail): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.remetente,
        to,
        subject,
        html,
        text,
      });
      this.logger.log(`E-mail "${subject}" enviado.`);
    } catch (error) {
      this.logger.error(
        `Falha ao enviar o e-mail "${subject}".`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(
        'Não foi possível enviar o e-mail. Tente novamente mais tarde.',
      );
    }
  }

  private async verificarConexao() {
    try {
      await this.transporter.verify();
      this.logger.log('Conexão com o servidor SMTP verificada.');
    } catch (error) {
      this.logger.warn(
        `Não foi possível conectar ao servidor SMTP: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
