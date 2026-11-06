import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmEmailChangeDto {
  @ApiProperty({
    example: 'abc123-token-uuid',
    description: 'Token de verificação recebido por e-mail',
  })
  @IsString()
  @IsNotEmpty({ message: 'O token não pode estar vazio.' })
  token: string;
}
