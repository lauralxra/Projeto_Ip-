import { PartialType } from '@nestjs/swagger';
import { CreateAcaoDto } from './create-acao.dto';

export class UpdateAcaoDto extends PartialType(CreateAcaoDto) {}
