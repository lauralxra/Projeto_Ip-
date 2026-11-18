import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

// RF15: a devolução para correção sempre vem acompanhada do motivo
export class DevolverRegistroDto {
  @ApiProperty({
    example: 'O valor informado diverge do relatório do trimestre.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'A justificativa da devolução é obrigatória.' })
  justificativa!: string;
}
