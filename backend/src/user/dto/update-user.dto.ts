import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MaxLength(150)
  name?: string;

  @ApiProperty({ required: false })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'O e-mail informado não é válido.' })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  confirmPassword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  role?: Role;
}