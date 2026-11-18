import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateNucleoDto } from './create-nucleo.dto';

// A imagem tem rota própria (PATCH /nucleos/:id/imagem), com upload validado
export class UpdateNucleoDto extends PartialType(
  OmitType(CreateNucleoDto, ['imagemUrl'] as const),
) {}
