import { PartialType } from '@nestjs/swagger';
import { CreateNotificacaoDto } from './create-notificacao.dto';

export class UpdateNotificacaoDto extends PartialType(CreateNotificacaoDto) {}
