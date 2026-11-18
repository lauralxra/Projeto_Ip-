import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { TrimestreEnum } from '@prisma/client';

export class FilterMetaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all', { message: 'indicadorId deve ser um UUID válido.' })
  indicadorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all', { message: 'nucleoId deve ser um UUID válido.' })
  nucleoId?: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ano deve ser um número inteiro.' })
  @Min(2000, { message: 'O ano deve ser maior ou igual a 2000.' })
  @Max(2100, { message: 'O ano deve ser menor ou igual a 2100.' })
  ano?: number;

  @ApiPropertyOptional({ enum: TrimestreEnum })
  @IsOptional()
  @IsEnum(TrimestreEnum, { message: 'O trimestre deve ser Q1, Q2, Q3 ou Q4.' })
  trimestre?: TrimestreEnum;

  @ApiPropertyOptional({
    description: 'true lista só as metas anuais (sem trimestre).',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'anual deve ser true ou false.' })
  anual?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro.' })
  @Min(1, { message: 'A página deve ser maior ou igual a 1.' })
  pagina: number = 1;

  // RNF01: limite máximo evita respostas grandes demais
  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro.' })
  @Min(1, { message: 'O limite deve ser maior ou igual a 1.' })
  @Max(100, { message: 'O limite deve ser no máximo 100.' })
  limite: number = 20;
}
