import { PartialType } from '@nestjs/swagger';
import { CreateNucleoDto } from './create-nucleo.dto';

export class UpdateNucleoDto extends PartialType(CreateNucleoDto) {}
