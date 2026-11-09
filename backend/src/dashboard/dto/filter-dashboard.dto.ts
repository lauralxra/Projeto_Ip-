import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusAprovacao, TrimestreEnum } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class FilterDashboardDto {
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

  @ApiPropertyOptional({
    description: 'Retorna apenas este indicador',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'O indicador deve ser um UUID válido.' })
  indicadorId?: string;

  @ApiPropertyOptional({
    description: 'Retorna apenas os indicadores deste programa',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'O programa deve ser um UUID válido.' })
  programaId?: string;

  @ApiPropertyOptional({
    description: 'Retorna apenas os indicadores desta ação',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all', { message: 'A ação deve ser um UUID válido.' })
  acaoId?: string;

  @ApiPropertyOptional({
    enum: StatusAprovacao,
    description:
      'Filtra pelo status da medição. PENDENTE, EM_PREENCHIMENTO e NECESSITA_CORRECAO são exclusivos da Administração.',
  })
  @IsOptional()
  @IsEnum(StatusAprovacao, {
    message: 'O status de aprovação informado é inválido.',
  })
  status?: StatusAprovacao;
}
