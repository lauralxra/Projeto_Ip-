import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'ID do usuário responsável pelo programa.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'responsavelId deve ser um UUID válido.' })
  responsavelId?: string;
}
