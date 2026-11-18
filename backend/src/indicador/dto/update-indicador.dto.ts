import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusRegistro, TipoDadoIndicador } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Texto vazio vira null (limpa o campo); undefined mantém o valor atual
const vazioParaNulo = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const texto = value.trim();
  return texto === '' ? null : texto;
};

// O escopo não é enviado: ele segue o núcleo (com núcleo = NUCLEO, sem = INSTITUCIONAL)
export class UpdateIndicadorDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @Transform(aparar)
  // Diferente de @IsOptional, não aceita null: o nome é obrigatório
  @ValidateIf((_, valor) => valor !== undefined)
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome do indicador é obrigatório.' })
  @MaxLength(200, { message: 'O nome deve ter no máximo 200 caracteres.' })
  nome?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(vazioParaNulo)
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  descricao?: string | null;

  @ApiPropertyOptional({ maxLength: 50, nullable: true })
  @Transform(vazioParaNulo)
  @IsOptional()
  @IsString({ message: 'A unidade de medida deve ser um texto.' })
  @MaxLength(50, { message: 'A unidade deve ter no máximo 50 caracteres.' })
  unidadeMedida?: string | null;

  @ApiPropertyOptional({ enum: TipoDadoIndicador })
  @IsOptional()
  @IsEnum(TipoDadoIndicador, { message: 'Tipo de dado inválido.' })
  tipoDado?: TipoDadoIndicador;

  @ApiPropertyOptional({
    nullable: true,
    description: 'null torna o indicador institucional (sem núcleo).',
  })
  @Transform(vazioParaNulo)
  @IsOptional()
  @IsUUID('all', { message: 'nucleoId deve ser um UUID válido.' })
  nucleoId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'null remove o programa.',
  })
  @Transform(vazioParaNulo)
  @IsOptional()
  @IsUUID('all', { message: 'programaId deve ser um UUID válido.' })
  programaId?: string | null;

  @ApiPropertyOptional({ maxLength: 50, nullable: true })
  @Transform(vazioParaNulo)
  @IsOptional()
  @IsString({ message: 'O código deve ser um texto.' })
  @MaxLength(50, { message: 'O código deve ter no máximo 50 caracteres.' })
  codigo?: string | null;

  @ApiPropertyOptional({
    enum: [StatusRegistro.ATIVO, StatusRegistro.INATIVO],
    description: 'Indicador inativo sai das listagens e dos cálculos.',
  })
  @IsOptional()
  @IsIn([StatusRegistro.ATIVO, StatusRegistro.INATIVO], {
    message: 'O status deve ser ATIVO ou INATIVO.',
  })
  status?: StatusRegistro;
}
