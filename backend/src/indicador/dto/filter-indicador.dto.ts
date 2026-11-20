import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusRegistro } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FilterIndicadorDto {
  @ApiPropertyOptional({
    enum: StatusRegistro,
    default: StatusRegistro.ATIVO,
    description:
      'Filtra indicadores por status. Por padrão retorna apenas indicadores ATIVO.',
  })
  @IsOptional()
  @IsEnum(StatusRegistro, {
    message: 'Status inválido. Use ATIVO, INATIVO ou ARQUIVADO.',
  })
  status?: StatusRegistro;
}
