import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { RequestRecoveryDto } from './request-recovery.dto';

export class ValidateCodeDto extends RequestRecoveryDto {
  @ApiProperty({
    example: '483920',
    description: 'Código numérico de 6 dígitos recebido por e-mail',
    minLength: 6,
    maxLength: 6,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Matches(/^\d{6}$/, { message: 'O código deve ter 6 dígitos numéricos.' })
  codigo!: string;
}
