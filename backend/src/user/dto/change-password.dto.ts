import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'SenhaAtual@123' })
  @IsString()
  @IsNotEmpty({ message: 'A senha atual não pode estar vazia.' })
  currentPassword: string;

  @ApiProperty({ example: 'NovaSenha@123' })
  @IsString()
  @IsNotEmpty({ message: 'A nova senha não pode estar vazia.' })
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  @Matches(/^(?!^\d+$)(?=.*[A-Za-z]).*$/, {
    message: 'A nova senha não pode ser puramente numérica.',
  })
  newPassword: string;

  @ApiProperty({ example: 'NovaSenha@123' })
  @IsString()
  @IsNotEmpty({ message: 'A confirmação de senha não pode estar vazia.' })
  confirmNewPassword: string;
}