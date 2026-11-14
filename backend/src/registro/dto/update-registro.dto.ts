import { PartialType } from '@nestjs/swagger';
import { CreateRegistroDto } from './create-registro.dto';

export class UpdateRegistroDto extends PartialType(CreateRegistroDto) {}
