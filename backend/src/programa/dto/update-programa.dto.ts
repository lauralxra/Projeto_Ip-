import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateProgramaDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(150)
  nome?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  nucleoId?: string;
}