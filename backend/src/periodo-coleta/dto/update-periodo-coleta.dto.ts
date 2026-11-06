import { PartialType } from '@nestjs/swagger';
import { CreatePeriodoColetaDto } from './create-periodo-coleta.dto';

export class UpdatePeriodoColetaDto extends PartialType(
  CreatePeriodoColetaDto,
) {}
