import { PartialType } from '@nestjs/swagger';
import { CreateIndicadorDto } from './create-indicador.dto';

export class UpdateIndicadorDto extends PartialType(CreateIndicadorDto) {}
