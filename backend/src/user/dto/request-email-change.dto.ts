import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RequestEmailChangeDto {
  @ApiProperty({
    example: 'novo@instituto-ipe.org.br',
    description: 'Novo e-mail desejado',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'O novo e-mail informado não é válido.' })
  @IsNotEmpty({ message: 'O novo e-mail não pode estar vazio.' })
  newEmail: string;

  @ApiProperty({
    example: 'novo@instituto-ipe.org.br',
    description: 'Confirmação do novo e-mail',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'A confirmação de e-mail não é válida.' })
  @IsNotEmpty({ message: 'A confirmação de e-mail não pode estar vazia.' })
  confirmNewEmail: string;

  @ApiProperty({
    example: 'MinhaSenh@123',
    description: 'Senha atual para confirmar a identidade',
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha atual não pode estar vazia.' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  currentPassword: string;
}