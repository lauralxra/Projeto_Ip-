import { ApiProperty } from '@nestjs/swagger';

export class NucleoAssociadoResponseDto {
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
    example: 'https://cdn.instituto-ipe.org.br/nucleos/nea.png',
    description: 'URL do logotipo do núcleo',
    nullable: true,
  })
  imagemUrl!: string | null;
}
