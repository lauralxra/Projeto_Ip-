import { ApiProperty } from '@nestjs/swagger';
import {
  IsByteLength,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../../common/validators/match.decorator';
import { IsNotCommonPassword } from '../../common/validators/not-common-password.decorator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'SenhaAtual123',
    description: 'Senha atual do usuário autenticado',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha atual não pode estar vazia.' })
  @MaxLength(72)
  @IsByteLength(0, 72)
  currentPassword!: string;

  @ApiProperty({
    example: 'NovaSenhaForte2026',
    description:
      'Nova senha: mínimo de 8 caracteres (máximo de 72 bytes), não pode ser puramente numérica nem uma senha comum (RN01)',
    format: 'password',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @IsNotEmpty({ message: 'A nova senha não pode estar vazia.' })
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  @MaxLength(72, { message: 'A nova senha deve ter no máximo 72 caracteres.' })
  // O bcrypt considera só os primeiros 72 bytes; acentos ocupam mais de 1 byte
  @IsByteLength(0, 72, { message: 'A nova senha excede o tamanho máximo.' })
  @Matches(/\D/, { message: 'A nova senha não pode ser puramente numérica.' })
  @IsNotCommonPassword({
    message: 'A nova senha é muito comum. Escolha uma senha mais segura.',
  })
  newPassword!: string;

  @ApiProperty({
    example: 'NovaSenhaForte2026',
    description:
      'Confirmação da nova senha, deve ser igual ao campo newPassword',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty({ message: 'A confirmação de senha não pode estar vazia.' })
  @Match('newPassword', {
    message: 'A nova senha e a confirmação devem ser iguais.',
  })
  confirmNewPassword!: string;
}
