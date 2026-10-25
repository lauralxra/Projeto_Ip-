import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../../common/validators/match.decorator';

export class CreateUserDto {
  @ApiProperty({
    example: 'Maria da Silva',
    description: 'Nome completo do usuário',
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    example: 'maria@instituto-ipe.org.br',
    description: 'E-mail válido e ainda não cadastrado (salvo em minúsculas)',
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
    example: 'SenhaForte123',
    description:
      'Senha com no mínimo 8 caracteres (máximo de 72 bytes), contendo letras e números',
    format: 'password',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha não pode estar vazia.' })
  @MinLength(8, { message: 'A senha precisa ter no mínimo 8 caracteres.' })
  @MaxLength(72)
  @IsByteLength(0, 72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'A senha deve conter letras e números.',
  })
  password!: string;

  @ApiProperty({
    example: 'SenhaForte123',
    description: 'Confirmação da senha, deve ser igual ao campo password',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty({ message: 'A confirmação de senha não pode estar vazia.' })
  @Match('password', { message: 'A senha e a confirmação devem ser iguais.' })
  confirmPassword!: string;

  @ApiProperty({
    enum: Role,
    example: Role.EQUIPE_GESTAO,
    description: 'Perfil de acesso atribuído ao novo usuário',
  })
  @IsEnum(Role, { message: 'Perfil de acesso inválido.' })
  role!: Role;
}
