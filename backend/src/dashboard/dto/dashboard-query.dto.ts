import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrimestreEnum } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    example: 2026,
    description: 'Ano de referência das metas e medições (padrão: ano atual)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ano deve ser um número inteiro.' })
  @Min(2000, { message: 'O ano deve ser maior ou igual a 2000.' })
  @Max(2100, { message: 'O ano deve ser menor ou igual a 2100.' })
  ano: number = new Date().getFullYear();

  @ApiPropertyOptional({
    enum: TrimestreEnum,
    description:
      'Restringe as medições a um trimestre e compara com a meta trimestral; sem ele, compara o ano com a meta anual',
  })
  @IsOptional()
  @IsEnum(TrimestreEnum, { message: 'O trimestre deve ser Q1, Q2, Q3 ou Q4.' })
  trimestre?: TrimestreEnum;

  @ApiPropertyOptional({
    description: 'Retorna apenas os indicadores deste núcleo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'O núcleo deve ser um UUID válido.' })
  nucleoId?: string;
}
