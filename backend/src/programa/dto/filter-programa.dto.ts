import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterProgramaDto {
  @ApiProperty({ required: false, example: 'Educação' })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  nucleoId?: string;
}