import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsByteLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'O email informado não é válido.' })
  @MaxLength(150)
  @IsNotEmpty({ message: 'O email não pode estar vazio.' })
  email!: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @IsNotEmpty({ message: 'A senha não pode estar vazia.' })
  @MaxLength(72)
  @IsByteLength(0, 72)
  password!: string;
}
