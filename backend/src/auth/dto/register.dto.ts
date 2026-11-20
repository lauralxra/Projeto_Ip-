import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsByteLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  MENSAGEM_NOME_INVALIDO,
  REGEX_NOME_USUARIO,
  sanitizarNomeUsuario,
  TAMANHO_MAX_NOME_USUARIO,
  TAMANHO_MIN_NOME_USUARIO,
} from '../../common/validators/nome-usuario.validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Maria da Silva',
    description: 'Nome completo do usuário para identificação institucional',
    minLength: TAMANHO_MIN_NOME_USUARIO,
    maxLength: TAMANHO_MAX_NOME_USUARIO,
  })
  @Transform(({ value }: { value: unknown }) => sanitizarNomeUsuario(value))
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MinLength(TAMANHO_MIN_NOME_USUARIO, {
    message: `O nome deve ter no mínimo ${TAMANHO_MIN_NOME_USUARIO} caracteres.`,
  })
  @MaxLength(TAMANHO_MAX_NOME_USUARIO, {
    message: `O nome deve ter no máximo ${TAMANHO_MAX_NOME_USUARIO} caracteres.`,
  })
  @Matches(REGEX_NOME_USUARIO, { message: MENSAGEM_NOME_INVALIDO })
  name!: string;

  @ApiProperty({
    example: 'maria@instituto-ipe.org.br',
    description:
      'Endereço de e-mail institucional válido (será convertido para minúsculas)',
    format: 'email',
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'O email informado não é válido.' })
  @MaxLength(150)
  @IsNotEmpty({ message: 'O email não pode estar vazio.' })
  email!: string;

  @ApiProperty({
    example: 'SenhaForte@123',
    description:
      'Senha de acesso da nova conta (mínimo de 8 caracteres e máximo de 72 bytes)',
    format: 'password',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha não pode estar vazia.' })
  @MinLength(8, { message: 'A senha precisa ter no mínimo 8 caracteres.' })
  @MaxLength(72)
  @IsByteLength(0, 72)
  password!: string;
}
