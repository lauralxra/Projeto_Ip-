import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: true,
    description: 'Define se o usuário está ativo (true) ou inativo (false)',
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
    message:
      'O status deve ser um booleano (true para ativo, false para inativo).',
  })
  ativo!: boolean;
}
