import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateIndicadorDto } from './create-indicador.dto';

export class UpdateIndicadorDto extends PartialType(CreateIndicadorDto) {
  @ApiPropertyOptional({
    description:
      'Se true, inativa todas as metas ativas e zera meta_aplicada dos registros deste indicador',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  semMeta?: boolean;
}
