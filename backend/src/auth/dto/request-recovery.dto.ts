import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

// UC02: e-mail da conta que terá a senha recuperada (também usado no reenvio)
export class RequestRecoveryDto {
  @ApiProperty({
    example: 'usuario@instituto-ipe.org.br',
    description: 'E-mail da conta (convertido para minúsculas)',
    format: 'email',
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'O email informado não é válido.' })
  @MaxLength(150)
  @IsNotEmpty({ message: 'O email não pode estar vazio.' })
  email!: string;
}
