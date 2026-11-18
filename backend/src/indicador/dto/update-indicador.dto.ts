import { PartialType, PickType } from '@nestjs/swagger';
import { CreateIndicadorDto } from './create-indicador.dto';

// RF02: só os dados descritivos são editáveis; escopo, núcleo e programa não mudam
export class UpdateIndicadorDto extends PartialType(
  PickType(CreateIndicadorDto, [
    'nome',
    'descricao',
    'unidadeMedida',
    'codigo',
  ] as const),
) {}
