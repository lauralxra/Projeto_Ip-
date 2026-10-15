import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  name!: string;

  @IsEmail()
  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  email!: string;

  @MinLength(7)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'A senha deve conter letras e números.',
  })
  password!: string;

  @IsEnum(Role, { message: 'Role invalida' })
  role!: Role;
}
