import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Maria da Silva',
    description: 'Novo nome completo do usuário',
    maxLength: 150,
    required: false,
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres.' })
  name?: string;

  @ApiProperty({
    example: 'maria@instituto-ipe.org.br',
    description: 'Novo e-mail do usuário',
    required: false,
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'O e-mail informado não é válido.' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Nova senha do usuário',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  password?: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Confirmação da nova senha',
    required: false,
  })
  @IsString()
  @IsOptional()
  confirmPassword?: string;

  @ApiProperty({
    example: 'ADMINISTRADOR',
    description: 'Perfil do usuário',
    required: false,
  })
  @IsOptional()
  role?: Role;
}