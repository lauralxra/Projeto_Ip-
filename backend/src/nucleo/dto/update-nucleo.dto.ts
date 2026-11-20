import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateNucleoDto } from './create-nucleo.dto';

// A imagem tem rota própria (PATCH /nucleos/:id/imagem), com upload validado.
// O status também: PATCH /nucleos/:id/desativar e /reativar (UC026), que fazem
// a checagem de estado e registram a auditoria correta.
export class UpdateNucleoDto extends PartialType(
  OmitType(CreateNucleoDto, ['imagemUrl'] as const),
) {}
