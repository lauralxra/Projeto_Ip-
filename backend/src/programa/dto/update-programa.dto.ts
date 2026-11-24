import { ApiPropertyOptional } from '@nestjs/swagger';
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
  ValidateIf,
} from 'class-validator';
import { aparar, MAX_PARTICIPANTES } from './create-programa.dto';

// @IsOptional também aceita null: descricao e nucleoId podem ser limpos com null

// Status muda pelas rotas próprias (desativar, arquivar, reativar)
export class UpdateProgramaDto {
  @ApiPropertyOptional({ maxLength: 150 })
  @Transform(aparar)
  // Diferente de @IsOptional, não aceita null: o nome é obrigatório no banco
  @ValidateIf((_, valor) => valor !== undefined)
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres.' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres.' })
  nome?: string;

  @ApiPropertyOptional({ maxLength: 2000, nullable: true })
  @Transform(aparar)
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(2000, {
    message: 'A descrição deve ter no máximo 2000 caracteres.',
  })
  descricao?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'null transforma o programa em institucional (sem núcleo).',
  })
  @IsOptional()
  @IsUUID('4', { message: 'nucleoId deve ser um UUID válido.' })
  nucleoId?: string | null;

  @ApiPropertyOptional({ description: 'Usuário responsável pelo programa.' })
  @IsOptional()
  @IsUUID('4', { message: 'responsavelId deve ser um UUID válido.' })
  responsavelId?: string | null;

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'Data de início do programa (AAAA-MM-DD).',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dataInicio deve estar no formato AAAA-MM-DD.',
  })
  @IsISO8601({ strict: true }, { message: 'dataInicio não é uma data válida.' })
  dataInicio?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Substitui a lista de participantes; [] remove todos. null limpa responsável e data.',
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
