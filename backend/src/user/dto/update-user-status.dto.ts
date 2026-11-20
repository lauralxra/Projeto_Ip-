import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: true,
    description:
      'true libera o acesso (exige tipo de conta definido); false bloqueia o login',
  })
  @Transform(({ value }: { value: unknown }): boolean => {
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'ATIVO' || value === 'ativo')
      return true;
    if (
      value === 0 ||
      value === '0' ||
      value === 'INATIVO' ||
      value === 'inativo'
    )
      return false;
    return Boolean(value);
  })
  @IsBoolean({
    message: 'ativo deve ser true ou false.',
  })
  ativo!: boolean;
}
