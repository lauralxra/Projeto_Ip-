import { ApiProperty } from '@nestjs/swagger';
import {
  EscopoIndicador,
  StatusAprovacao,
  TipoDadoIndicador,
  TrimestreEnum,
} from '@prisma/client';

export class DashboardNucleoDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Núcleo de Educação Ambiental' })
  nome!: string;

  @ApiProperty({ example: 'NEA' })
  sigla!: string;

  @ApiProperty({ example: '#2E7D32', nullable: true })
  corHex!: string | null;
}

export class DashboardRegistroDto {
  @ApiProperty({ enum: TrimestreEnum, example: TrimestreEnum.Q1 })
  trimestre!: TrimestreEnum;

  @ApiProperty({ example: 320, nullable: true })
  valorRealizado!: number | null;

  @ApiProperty({ example: 300, nullable: true })
  metaAplicada!: number | null;

  @ApiProperty({ enum: StatusAprovacao, example: StatusAprovacao.APROVADO })
  statusAprovacao!: StatusAprovacao;
}

export class DashboardIndicadorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'IND-001', nullable: true })
  codigo!: string | null;

  @ApiProperty({ example: 'Pessoas atendidas' })
  nome!: string;

  @ApiProperty({ enum: TipoDadoIndicador })
  tipoDado!: TipoDadoIndicador;

  @ApiProperty({ example: 'pessoas', nullable: true })
  unidadeMedida!: string | null;

  @ApiProperty({ enum: EscopoIndicador })
  escopo!: EscopoIndicador;

  @ApiProperty({
    type: DashboardNucleoDto,
    nullable: true,
    description: 'Nulo para indicadores institucionais',
  })
  nucleo!: DashboardNucleoDto | null;

  @ApiProperty({
    example: 1200,
    nullable: true,
    description: 'Meta anual, ou a meta do trimestre quando ele é filtrado',
  })
  meta!: number | null;

  @ApiProperty({
    example: 950,
    nullable: true,
    description:
      'Soma das medições visíveis no período; para indicadores percentuais, a última medição informada',
  })
  realizado!: number | null;

  @ApiProperty({
    example: 79.2,
    nullable: true,
    description: 'Realizado em relação à meta (%), com uma casa decimal',
  })
  percentualAtingido!: number | null;

  @ApiProperty({ type: [DashboardRegistroDto] })
  registros!: DashboardRegistroDto[];
}

export class DashboardIndicadoresResponseDto {
  @ApiProperty({ example: 2026 })
  ano!: number;

  @ApiProperty({ enum: TrimestreEnum, nullable: true })
  trimestre!: TrimestreEnum | null;

  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ type: [DashboardIndicadorDto] })
  indicadores!: DashboardIndicadorDto[];
}
