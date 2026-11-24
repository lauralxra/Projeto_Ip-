import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  MENSAGEM_NOME_INVALIDO,
  REGEX_NOME_USUARIO,
  sanitizarNomeUsuario,
  TAMANHO_MAX_NOME_USUARIO,
  TAMANHO_MIN_NOME_USUARIO,
} from '../../common/validators/nome-usuario.validator';

// Nome e e-mail são opcionais, mas não aceitam null: os dois são obrigatórios no banco
export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Maria da Silva',
    description: 'Novo nome completo do usuário',
    minLength: TAMANHO_MIN_NOME_USUARIO,
    maxLength: TAMANHO_MAX_NOME_USUARIO,
  })
  @Transform(({ value }: { value: unknown }) => sanitizarNomeUsuario(value))
  @ValidateIf((_, valor) => valor !== undefined)
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MinLength(TAMANHO_MIN_NOME_USUARIO, {
    message: `O nome deve ter no mínimo ${TAMANHO_MIN_NOME_USUARIO} caracteres.`,
  })
  @MaxLength(TAMANHO_MAX_NOME_USUARIO, {
    message: `O nome deve ter no máximo ${TAMANHO_MAX_NOME_USUARIO} caracteres.`,
  })
  @Matches(REGEX_NOME_USUARIO, { message: MENSAGEM_NOME_INVALIDO })
  name?: string;

  @ApiPropertyOptional({
    example: 'maria@instituto-ipe.org.br',
    format: 'email',
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @ValidateIf((_, valor) => valor !== undefined)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(150, { message: 'O e-mail deve ter no máximo 150 caracteres.' })
  email?: string;
}
