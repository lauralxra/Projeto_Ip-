import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrimestreEnum } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Campos de texto opcionais enviados como "" viram ausentes
export const vazioParaIndefinido = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const texto = value.trim();
  return texto === '' ? undefined : texto;
};

// RF20: meta de um indicador para um ano (anual) ou trimestre
export class CreateMetaDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'indicadorId deve ser um UUID válido.' })
  indicadorId!: string;

  @ApiProperty({ example: 2026, minimum: 2000, maximum: 2100 })
  @IsInt({ message: 'Ano inválido.' })
  @Min(2000, { message: 'Ano inválido.' })
  @Max(2100, { message: 'Ano inválido.' })
  ano!: number;

  @ApiPropertyOptional({
    enum: TrimestreEnum,
    description: 'Ausente ou nulo = meta anual.',
  })
  @IsOptional()
  @IsEnum(TrimestreEnum, { message: 'Trimestre inválido.' })
  trimestre?: TrimestreEnum | null;

  // A coluna é Decimal(15, 2)
  @ApiProperty({ example: 120, exclusiveMinimum: true, minimum: 0 })
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'Valor da meta inválido (até 2 casas decimais).' },
  )
  @IsPositive({ message: 'O valor da meta deve ser positivo.' })
  @Max(9999999999999.99, { message: 'Valor da meta inválido.' })
  valorMeta!: number;

  @ApiPropertyOptional({
    example: 'Meta pactuada no planejamento anual',
    maxLength: 500,
  })
  @Transform(vazioParaIndefinido)
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(500, {
    message: 'A descrição deve ter no máximo 500 caracteres.',
  })
  descricao?: string;
}
