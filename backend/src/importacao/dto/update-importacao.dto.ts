import { PartialType } from '@nestjs/swagger';
import { CreateImportacaoDto } from './create-importacao.dto';

export class UpdateImportacaoDto extends PartialType(CreateImportacaoDto) {}
