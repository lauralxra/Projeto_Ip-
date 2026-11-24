import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Role, TipoNotificacao } from '@prisma/client';

export const MAX_DESTINATARIOS_EXPLICITOS = 500;

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// RN01: o destino precisa ser explícito. Sem nucleoId, perfilAlvo nem destinatarioIds,
// o envio para todos os usuários ativos só acontece com `todos: true`.
export class CreateNotificacaoDto {
  @ApiProperty({ example: 'Prazo de preenchimento', maxLength: 150 })
  @Transform(aparar)
  @IsString()
  @MinLength(3, { message: 'O título deve ter no mínimo 3 caracteres.' })
  @MaxLength(150, { message: 'O título deve ter no máximo 150 caracteres.' })
  titulo: string;

  @ApiProperty({
    example: 'O prazo para preenchimento do Q1 encerra em 3 dias.',
    maxLength: 5000,
  })
  @Transform(aparar)
  @IsString()
  @MinLength(10, { message: 'A mensagem deve ter no mínimo 10 caracteres.' })
  @MaxLength(5000, {
    message: 'A mensagem deve ter no máximo 5000 caracteres.',
  })
  mensagem: string;

  @ApiProperty({ enum: TipoNotificacao, example: TipoNotificacao.AVISO_GERAL })
  @IsEnum(TipoNotificacao, { message: 'Tipo de notificação inválido.' })
  tipo: TipoNotificacao;

  @ApiPropertyOptional({
    description:
      'Núcleo de destino. Sem perfilAlvo, a notificação vai apenas aos diretores do núcleo (RN01).',
  })
  @IsOptional()
  @IsUUID('4', { message: 'nucleoId deve ser um UUID válido.' })
  nucleoId?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role, { message: 'Perfil-alvo inválido.' })
  perfilAlvo?: Role;

  @ApiPropertyOptional({
    description:
      'Destinatários específicos. Os filtros de núcleo e perfil, se informados, também se aplicam.',
    example: ['uuid-user-1', 'uuid-user-2'],
    maxItems: MAX_DESTINATARIOS_EXPLICITOS,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'destinatarioIds não pode ser vazio.' })
  @ArrayMaxSize(MAX_DESTINATARIOS_EXPLICITOS, {
    message: `Informe no máximo ${MAX_DESTINATARIOS_EXPLICITOS} destinatários.`,
  })
  @ArrayUnique({ message: 'destinatarioIds não pode ter IDs repetidos.' })
  @IsUUID('4', { each: true, message: 'Cada destinatário deve ser um UUID.' })
  destinatarioIds?: string[];

  @ApiPropertyOptional({
    description:
      'Confirma o envio a todos os usuários ativos quando nenhum outro destino é informado.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  todos?: boolean;
}
