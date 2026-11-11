import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Maria da Silva',
    description: 'Novo nome completo do usuário',
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres.' })
  name!: string;
}
