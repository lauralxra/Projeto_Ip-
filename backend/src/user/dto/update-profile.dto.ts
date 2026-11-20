import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsByteLength,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

// Edição do próprio perfil. Trocar o e-mail exige a senha atual, porque o e-mail
// é o login da conta
export class UpdateProfileDto extends UpdateUserDto {
  @ApiPropertyOptional({
    format: 'password',
    description: 'Senha atual; obrigatória para trocar o e-mail',
  })
  @ValidateIf((dto: UpdateProfileDto) => dto.email !== undefined)
  @IsString({ message: 'Informe a senha atual para trocar o e-mail.' })
  @IsNotEmpty({ message: 'Informe a senha atual para trocar o e-mail.' })
  @MaxLength(72)
  @IsByteLength(0, 72)
  currentPassword?: string;
}
