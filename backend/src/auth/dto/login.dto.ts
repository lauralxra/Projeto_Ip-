import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsByteLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'usuario@instituto-ipe.org.br',
    description:
      'Endereço de e-mail institucional do usuário cadastrado na plataforma',
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
      'Senha de acesso da conta (mínimo de 8 caracteres, limitada a 72 bytes)',
    format: 'password',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha não pode estar vazia.' })
  @MaxLength(72)
  @IsByteLength(0, 72)
  password!: string;
}
