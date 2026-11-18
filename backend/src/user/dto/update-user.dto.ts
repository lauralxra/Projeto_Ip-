import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

// Nome e e-mail são opcionais, mas não aceitam null: os dois são obrigatórios no banco
export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Maria da Silva',
    description: 'Novo nome completo do usuário',
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ValidateIf((_, valor) => valor !== undefined)
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres.' })
  name?: string;

  @ApiPropertyOptional({
    example: 'maria@instituto-ipe.org.br',
    format: 'email',
    maxLength: 150,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @ValidateIf((_, valor) => valor !== undefined)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(150, { message: 'O e-mail deve ter no máximo 150 caracteres.' })
  email?: string;
}
