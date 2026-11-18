import { PartialType, PickType } from '@nestjs/swagger';
import { CreateMetaDto } from './create-meta.dto';

// RF21: indicador, ano e trimestre identificam a meta e não são editáveis
export class UpdateMetaDto extends PartialType(
  PickType(CreateMetaDto, ['valorMeta', 'descricao'] as const),
) {}
