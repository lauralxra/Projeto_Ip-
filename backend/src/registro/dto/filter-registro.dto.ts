import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { StatusAprovacao, StatusRegistro, TrimestreEnum } from '@prisma/client';

export class FilterRegistroDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'indicadorId deve ser um UUID válido.' })
  indicadorId?: string;

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

  @ApiPropertyOptional({ enum: StatusAprovacao })
  @IsOptional()
  @IsEnum(StatusAprovacao, { message: 'Status de aprovação inválido.' })
  statusAprovacao?: StatusAprovacao;

  @ApiPropertyOptional({
    enum: StatusRegistro,
    default: StatusRegistro.ATIVO,
    description: 'Só o administrador consulta registros inativos.',
  })
  @IsOptional()
  @IsEnum(StatusRegistro, { message: 'O status deve ser ATIVO ou INATIVO.' })
  status?: StatusRegistro;

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
