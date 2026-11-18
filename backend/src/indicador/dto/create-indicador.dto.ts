import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EscopoIndicador, TipoDadoIndicador } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Campos opcionais enviados como "" pelo formulário viram ausentes
const vazioParaIndefinido = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const texto = value.trim();
  return texto === '' ? undefined : texto;
};

// RF01, RF05, RF06, RF07
export class CreateIndicadorDto {
  @ApiProperty({ example: 'Startups incubadas', maxLength: 200 })
  @Transform(aparar)
  @IsString()
  @IsNotEmpty({ message: 'O nome do indicador é obrigatório.' })
  @MaxLength(200)
  nome!: string;

  @ApiPropertyOptional({
    example: 'Quantidade de startups ativas no trimestre',
  })
  @Transform(vazioParaIndefinido)
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ example: 'unidades', maxLength: 50 })
  @Transform(vazioParaIndefinido)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unidadeMedida?: string;

  @ApiProperty({ enum: EscopoIndicador, example: EscopoIndicador.NUCLEO })
  @IsEnum(EscopoIndicador, { message: 'Escopo inválido.' })
  escopo!: EscopoIndicador;

  @ApiPropertyOptional({
    enum: TipoDadoIndicador,
    default: TipoDadoIndicador.NUMERICO,
  })
  @IsOptional()
  @IsEnum(TipoDadoIndicador, { message: 'Tipo de dado inválido.' })
  tipoDado?: TipoDadoIndicador;

  @ApiPropertyOptional({ format: 'uuid' })
  @Transform(vazioParaIndefinido)
  @IsOptional()
  @IsUUID('all', { message: 'nucleoId deve ser um UUID válido.' })
  nucleoId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @Transform(vazioParaIndefinido)
  @IsOptional()
  @IsUUID('all', { message: 'programaId deve ser um UUID válido.' })
  programaId?: string;

  @ApiPropertyOptional({ example: 'NEI-01', maxLength: 50 })
  @Transform(vazioParaIndefinido)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;
}
