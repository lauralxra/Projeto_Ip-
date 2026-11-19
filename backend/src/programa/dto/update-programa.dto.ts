import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { aparar } from './create-programa.dto';

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

  @ApiPropertyOptional({
    nullable: true,
    description:
      'ID do usuário responsável pelo programa. null desvincula o responsável.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'responsavelId deve ser um UUID válido.' })
  responsavelId?: string | null;
}
