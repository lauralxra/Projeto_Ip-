import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateNucleoDto {
  @ApiProperty({
    example: 'Núcleo de Educação Ambiental',
    description: 'Nome do núcleo, único entre os núcleos não excluídos',
    maxLength: 150,
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres.' })
  nome!: string;

  @ApiProperty({
    example: 'NEA',
    description:
      'Sigla do núcleo (salva em maiúsculas), única entre os núcleos não excluídos',
    maxLength: 20,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'A sigla não pode estar vazia.' })
  @MaxLength(20, { message: 'A sigla deve ter no máximo 20 caracteres.' })
  sigla!: string;

  @ApiPropertyOptional({
    example: 'Atua em projetos de educação ambiental nas comunidades.',
    description: 'Descrição das atividades do núcleo',
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    example: '#2E7D32',
    description:
      'Cor de identificação do núcleo no formato hexadecimal #RRGGBB',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'A cor deve estar no formato hexadecimal #RRGGBB.',
  })
  corHex?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.instituto-ipe.org.br/nucleos/nea.png',
    description: 'URL da imagem ou logotipo do núcleo',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A imagem deve ser uma URL válida.' })
  imagemUrl?: string;
}
