import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: true,
    description:
      'true libera o acesso (exige tipo de conta definido); false bloqueia o login',
  })
  @IsBoolean({ message: 'ativo deve ser true ou false.' })
  ativo!: boolean;
}
