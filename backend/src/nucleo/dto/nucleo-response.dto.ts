import { ApiProperty } from '@nestjs/swagger';
import { StatusRegistro } from '@prisma/client';

export class NucleoResponseDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'Identificador único do núcleo (UUID)',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({ example: 'Núcleo de Educação Ambiental' })
  nome!: string;

  @ApiProperty({ example: 'NEA' })
  sigla!: string;

  @ApiProperty({
    example: 'Atua em projetos de educação ambiental nas comunidades.',
    nullable: true,
  })
  descricao!: string | null;

  @ApiProperty({ example: '#2E7D32', nullable: true })
  corHex!: string | null;

  @ApiProperty({
    example: 'https://cdn.instituto-ipe.org.br/nucleos/nea.png',
    nullable: true,
  })
  imagemUrl!: string | null;

  @ApiProperty({ enum: StatusRegistro, example: StatusRegistro.ATIVO })
  status!: StatusRegistro;

  @ApiProperty({
    example: '2026-10-25T15:00:00.000Z',
    description: 'Data e horário de criação (ISO 8601)',
  })
  createdAt!: Date;
}

export class NucleoPaginadoResponseDto {
  @ApiProperty({ type: [NucleoResponseDto] })
  itens!: NucleoResponseDto[];

  @ApiProperty({
    example: 42,
    description: 'Total de núcleos que atendem aos filtros',
  })
  total!: number;

  @ApiProperty({ example: 1 })
  pagina!: number;

  @ApiProperty({ example: 20 })
  limite!: number;
}
