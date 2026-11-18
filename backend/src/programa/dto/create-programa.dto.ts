import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateProgramaDto {
  @ApiProperty({ example: 'Programa de Educação Infantil' })
  @IsString()
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres.' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres.' })
  nome: string;

  @ApiProperty({ required: false, example: 'Programa voltado para crianças de 0 a 6 anos.' })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ required: false, example: 'uuid-do-nucleo' })
  @IsUUID()
  @IsOptional()
  nucleoId?: string;
}