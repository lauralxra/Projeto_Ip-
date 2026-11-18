import { ApiProperty } from '@nestjs/swagger';
import { TrimestreEnum } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';

// RF08/RF09: valor de um indicador em um trimestre
export class SalvarRegistroDto {
  @ApiProperty({ example: 2026, minimum: 2000, maximum: 2100 })
  @IsInt({ message: 'Ano inválido.' })
  @Min(2000, { message: 'Ano inválido.' })
  @Max(2100, { message: 'Ano inválido.' })
  ano!: number;

  @ApiProperty({ enum: TrimestreEnum, example: TrimestreEnum.Q1 })
  @IsEnum(TrimestreEnum, { message: 'Trimestre inválido.' })
  trimestre!: TrimestreEnum;

  // A coluna é Decimal(15, 2)
  @ApiProperty({ example: 42.5, minimum: 0 })
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'Valor realizado inválido (até 2 casas decimais).' },
  )
  @Min(0, { message: 'Valor realizado inválido.' })
  @Max(9999999999999.99, { message: 'Valor realizado inválido.' })
  valorRealizado!: number;
}
