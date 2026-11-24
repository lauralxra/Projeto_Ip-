import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { StatusRegistro } from '@prisma/client';
import { aparar } from './create-programa.dto';

export class FilterProgramaDto {
  @ApiPropertyOptional({ example: 'Educação', maxLength: 150 })
  @Transform(aparar)
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto.' })
  @MaxLength(150, { message: 'O termo deve ter no máximo 150 caracteres.' })
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'nucleoId deve ser um UUID válido.' })
  nucleoId?: string;

  @ApiPropertyOptional({
    enum: StatusRegistro,
    default: StatusRegistro.ATIVO,
    description:
      'Só o administrador consulta programas inativos ou arquivados.',
  })
  @IsOptional()
  @IsEnum(StatusRegistro, {
    message: 'O status deve ser ATIVO, INATIVO ou ARQUIVADO.',
  })
  status?: StatusRegistro;

  @ApiPropertyOptional({ example: 100, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro.' })
  @Min(1)
  @Max(500)
  limite?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro.' })
  @Min(1)
  pagina?: number;
}
