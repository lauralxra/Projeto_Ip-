import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusRegistro, TrimestreEnum } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SearchNucleoDto {
  @ApiPropertyOptional({
    example: 'ambiental',
    description:
      'Texto buscado no nome, sigla ou descrição do núcleo (sem diferenciar maiúsculas)',
    maxLength: 150,
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'O termo deve ter no máximo 150 caracteres.' })
  termo?: string;

  @ApiPropertyOptional({
    description: 'Retorna apenas núcleos que possuem este programa',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'O programa deve ser um UUID válido.' })
  programaId?: string;

  @ApiPropertyOptional({
    enum: StatusRegistro,
    description: 'Estado do núcleo',
  })
  @IsOptional()
  @IsEnum(StatusRegistro, {
    message: 'O estado deve ser ATIVO, INATIVO ou ARQUIVADO.',
  })
  status?: StatusRegistro;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Data inicial de criação do núcleo (AAAA-MM-DD), inclusiva',
  })
  @IsOptional()
  @Matches(DATA_REGEX, {
    message: 'A data inicial deve estar no formato AAAA-MM-DD.',
  })
  @IsDateString({ strict: true }, { message: 'A data inicial é inválida.' })
  dataInicio?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Data final de criação do núcleo (AAAA-MM-DD), inclusiva',
  })
  @IsOptional()
  @Matches(DATA_REGEX, {
    message: 'A data final deve estar no formato AAAA-MM-DD.',
  })
  @IsDateString({ strict: true }, { message: 'A data final é inválida.' })
  dataFim?: string;

  @ApiPropertyOptional({
    example: 2026,
    description:
      'Retorna núcleos com registros de indicadores neste ano (obrigatório ao filtrar por trimestre)',
  })
  @ValidateIf(
    (o: SearchNucleoDto) => o.ano !== undefined || o.trimestre !== undefined,
  )
  @IsDefined({ message: 'Informe o ano para filtrar por trimestre.' })
  @Type(() => Number)
  @IsInt({ message: 'O ano deve ser um número inteiro.' })
  @Min(2000, { message: 'O ano deve ser maior ou igual a 2000.' })
  @Max(2100, { message: 'O ano deve ser menor ou igual a 2100.' })
  ano?: number;

  @ApiPropertyOptional({
    enum: TrimestreEnum,
    description: 'Retorna núcleos com registros de indicadores neste trimestre',
  })
  @IsOptional()
  @IsEnum(TrimestreEnum, { message: 'O trimestre deve ser Q1, Q2, Q3 ou Q4.' })
  trimestre?: TrimestreEnum;

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
