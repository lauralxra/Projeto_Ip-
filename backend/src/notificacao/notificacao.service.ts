import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import { UpdateNotificacaoDto } from './dto/update-notificacao.dto';

export interface DestinatarioAvisoSeguranca {
  email: string;
  nome: string;
}

@Injectable()
export class NotificacaoService {
  private readonly logger = new Logger(NotificacaoService.name);

  constructor(private readonly mail: MailService) {}

  // Aviso de segurança por e-mail. Não lança erro: a senha já foi trocada e uma falha
  // no SMTP não pode fazer o usuário achar que a alteração não aconteceu.
  async notificarSenhaAlterada(
    destinatario: DestinatarioAvisoSeguranca,
  ): Promise<boolean> {
    try {
      await this.mail.sendPasswordChanged(destinatario);
      return true;
    } catch (error) {
      this.logger.warn(
        `Senha alterada, mas o aviso por e-mail não foi enviado: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  create(_createNotificacaoDto: CreateNotificacaoDto) {
    return 'This action adds a new notificacao';
  }

  findAll() {
    return `This action returns all notificacao`;
  }

  findOne(id: number) {
    return `This action returns a #${id} notificacao`;
  }

  update(id: number, _updateNotificacaoDto: UpdateNotificacaoDto) {
    return `This action updates a #${id} notificacao`;
  }

  remove(id: number) {
    return `This action removes a #${id} notificacao`;
  }
}
