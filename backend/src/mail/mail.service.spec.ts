import { Logger, ServiceUnavailableException } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { MailService } from './mail.service';

describe('MailService', () => {
  const envOriginal = process.env;
  let transport: { sendMail: jest.Mock; verify: jest.Mock };
  let createTransport: jest.SpyInstance;

  const configurar = (env: Record<string, string | undefined> = {}) => {
    process.env = {
      ...envOriginal,
      MAIL_HOST: 'smtp.teste.com',
      MAIL_PORT: '587',
      MAIL_USER: 'usuario',
      MAIL_PASS: 'senha',
      MAIL_FROM: 'nao-responda@ipe.org.br',
      ...env,
    };
    return new MailService();
  };

  beforeEach(() => {
    transport = {
      sendMail: jest.fn().mockResolvedValue({}),
      verify: jest.fn().mockResolvedValue(true),
    };
    createTransport = jest
      .spyOn(nodemailer, 'createTransport')
      .mockReturnValue(transport as unknown as Transporter);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = envOriginal;
    jest.restoreAllMocks();
  });

  describe('transporte SMTP', () => {
    it('usa as variáveis de ambiente e STARTTLS na porta 587', () => {
      configurar();

      expect(createTransport).toHaveBeenCalledWith({
        host: 'smtp.teste.com',
        port: 587,
        secure: false,
        auth: { user: 'usuario', pass: 'senha' },
      });
    });

    it('usa a porta 587 quando MAIL_PORT não é informada', () => {
      configurar({ MAIL_PORT: undefined });

      expect(createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: 587, secure: false }),
      );
    });

    it('ativa TLS direto na porta 465', () => {
      configurar({ MAIL_PORT: '465' });

      expect(createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: 465, secure: true }),
      );
    });
  });

  describe('sendMail', () => {
    it('envia com o remetente configurado', async () => {
      const service = configurar();

      await service.sendMail({
        to: 'maria@ipe.org.br',
        subject: 'Assunto',
        html: '<p>Olá</p>',
        text: 'Olá',
      });

      expect(transport.sendMail).toHaveBeenCalledWith({
        from: '"Sistema IPÊ" <nao-responda@ipe.org.br>',
        to: 'maria@ipe.org.br',
        subject: 'Assunto',
        html: '<p>Olá</p>',
        text: 'Olá',
      });
    });

    it('falha no SMTP vira 503 padronizado e é registrada no log', async () => {
      const service = configurar();
      transport.sendMail.mockRejectedValue(new Error('auth failed'));

      await expect(
        service.sendMail({ to: 'maria@ipe.org.br', subject: 'A', html: 'B' }),
      ).rejects.toThrow(ServiceUnavailableException);
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('sendPasswordChanged', () => {
    it('envia o aviso de segurança para o usuário com data e hora', async () => {
      const service = configurar();

      await service.sendPasswordChanged({
        email: 'maria@ipe.org.br',
        nome: 'Maria',
        alteradaEm: new Date('2026-11-17T15:30:00.000Z'),
      });

      const [mensagem] = transport.sendMail.mock.calls[0] as [
        { to: string; subject: string; html: string; text: string },
      ];
      expect(mensagem.to).toBe('maria@ipe.org.br');
      expect(mensagem.subject).toBe('Sua senha foi alterada - Plataforma IPÊ');
      // 15:30 UTC = 12:30 no horário de Recife
      expect(mensagem.html).toContain('17/11/2026, 12:30');
      expect(mensagem.text).toContain('Olá, Maria.');
    });

    it('escapa o nome do usuário no HTML', async () => {
      const service = configurar();

      await service.sendPasswordChanged({
        email: 'maria@ipe.org.br',
        nome: '<script>alert(1)</script>',
      });

      const [mensagem] = transport.sendMail.mock.calls[0] as [{ html: string }];
      expect(mensagem.html).not.toContain('<script>');
      expect(mensagem.html).toContain('&lt;script&gt;');
    });
  });

  describe('onModuleInit', () => {
    it('avisa quais variáveis faltam e não tenta conectar', () => {
      const service = configurar({ MAIL_HOST: undefined, MAIL_PASS: '' });

      service.onModuleInit();

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Envio de e-mails não configurado. Defina: MAIL_HOST, MAIL_PASS.',
      );
      expect(transport.verify).not.toHaveBeenCalled();
    });

    it('verifica a conexão quando o SMTP está configurado', () => {
      const service = configurar();

      service.onModuleInit();

      expect(transport.verify).toHaveBeenCalledTimes(1);
    });

    it('SMTP indisponível só gera aviso, sem derrubar a inicialização', async () => {
      const service = configurar();
      transport.verify.mockRejectedValue(new Error('ECONNREFUSED'));

      expect(() => service.onModuleInit()).not.toThrow();
      await new Promise(process.nextTick);

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Não foi possível conectar ao servidor SMTP: ECONNREFUSED',
      );
    });
  });
});
