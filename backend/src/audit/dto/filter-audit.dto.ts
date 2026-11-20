import { ApiPropertyOptional } from '@nestjs/swagger';
import { AcaoAuditoria } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FilterAuditDto {
  @ApiPropertyOptional({
    description: 'Nome da entidade auditada (ex: Indicador, Programa, Meta)',
  })
  @IsOptional()
  @IsString({ message: 'A entidade deve ser um texto.' })
  entidade?: string;

  @ApiPropertyOptional({
    enum: AcaoAuditoria,
    description: 'Tipo da ação auditada',
  })
  @IsOptional()
  @IsEnum(AcaoAuditoria, { message: 'Ação de auditoria inválida.' })
  acao?: AcaoAuditoria;

  @ApiPropertyOptional({
    description: 'Data de início (ISO string ou YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de início inválida.' })
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data de fim (ISO string ou YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de fim inválida.' })
  dataFim?: string;

  @ApiPropertyOptional({ example: 100, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro.' })
  @Min(1)
  @Max(500)
  limite?: number;
}
