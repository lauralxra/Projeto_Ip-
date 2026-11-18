import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

// RF09: só o valor realizado é editável; ano e trimestre identificam o registro
export class UpdateRegistroDto {
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
