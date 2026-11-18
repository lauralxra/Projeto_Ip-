import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const MAX_PARTICIPANTES = 100;

export const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateProgramaDto {
  @ApiProperty({ example: 'Programa de Educação Infantil', maxLength: 150 })
  @Transform(aparar)
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres.' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres.' })
  nome!: string;

  @ApiPropertyOptional({
    example: 'Programa voltado para crianças de 0 a 6 anos.',
    maxLength: 2000,
  })
  @Transform(aparar)
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(2000, {
    message: 'A descrição deve ter no máximo 2000 caracteres.',
  })
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Núcleo do programa. Sem núcleo, o programa é institucional.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'nucleoId deve ser um UUID válido.' })
  nucleoId?: string;

  @ApiPropertyOptional({ description: 'Usuário responsável pelo programa.' })
  @IsOptional()
  @IsUUID('4', { message: 'responsavelId deve ser um UUID válido.' })
  responsavelId?: string;

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'Data de início do programa (AAAA-MM-DD).',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dataInicio deve estar no formato AAAA-MM-DD.',
  })
  @IsISO8601({ strict: true }, { message: 'dataInicio não é uma data válida.' })
  dataInicio?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Usuários que participam do programa.',
    maxItems: MAX_PARTICIPANTES,
  })
  @IsOptional()
  @IsArray({ message: 'participanteIds deve ser uma lista.' })
  @ArrayMaxSize(MAX_PARTICIPANTES, {
    message: `Informe no máximo ${MAX_PARTICIPANTES} participantes.`,
  })
  @ArrayUnique({ message: 'participanteIds não pode ter IDs repetidos.' })
  @IsUUID('4', {
    each: true,
    message: 'Cada participante deve ser um UUID válido.',
  })
  participanteIds?: string[];
}
