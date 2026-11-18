import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// RN03: a devolução para correção sempre vem acompanhada do motivo
export class DevolverRegistroDto {
  @ApiProperty({
    example: 'O valor informado diverge do relatório do trimestre.',
    maxLength: 1000,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'A justificativa deve ser um texto.' })
  @IsNotEmpty({ message: 'A justificativa da devolução é obrigatória.' })
  @MaxLength(1000, {
    message: 'A justificativa deve ter no máximo 1000 caracteres.',
  })
  justificativa!: string;
}
