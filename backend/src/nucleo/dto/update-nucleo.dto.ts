import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { StatusRegistro } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateNucleoDto } from './create-nucleo.dto';

// A imagem tem rota própria (PATCH /nucleos/:id/imagem), com upload validado
export class UpdateNucleoDto extends PartialType(
  OmitType(CreateNucleoDto, ['imagemUrl'] as const),
) {
  @ApiPropertyOptional({
    enum: StatusRegistro,
    description: 'Status do núcleo (permite reativação pela tela de edição)',
  })
  @IsOptional()
  @IsEnum(StatusRegistro, {
    message: 'Status inválido. Use ATIVO, INATIVO ou ARQUIVADO.',
  })
  status?: StatusRegistro;
}
