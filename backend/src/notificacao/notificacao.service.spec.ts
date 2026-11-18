import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NotificacaoService } from './notificacao.service';

describe('NotificacaoService', () => {
  let service: NotificacaoService;
  let mail: { sendPasswordChanged: jest.Mock };
  const destinatario = { email: 'maria@ipe.org.br', nome: 'Maria' };

  beforeEach(() => {
    mail = { sendPasswordChanged: jest.fn().mockResolvedValue(undefined) };
    service = new NotificacaoService(mail as unknown as MailService);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('notificarSenhaAlterada', () => {
    it('envia o aviso de segurança por e-mail', async () => {
      await expect(service.notificarSenhaAlterada(destinatario)).resolves.toBe(
        true,
      );
      expect(mail.sendPasswordChanged).toHaveBeenCalledWith(destinatario);
    });

    it('não lança erro quando o SMTP falha e registra no log', async () => {
      mail.sendPasswordChanged.mockRejectedValue(
        new ServiceUnavailableException('SMTP fora do ar'),
      );

      await expect(service.notificarSenhaAlterada(destinatario)).resolves.toBe(
        false,
      );
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });
  });
});
