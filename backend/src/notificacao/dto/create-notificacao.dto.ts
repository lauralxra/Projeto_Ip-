import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { TipoNotificacao, Role } from '@prisma/client';

export class CreateNotificacaoDto {
  @ApiProperty({ example: 'Prazo de preenchimento' })
  @IsString()
  @MinLength(3, { message: 'O título deve ter no mínimo 3 caracteres.' })
  titulo: string;

  @ApiProperty({ example: 'O prazo para preenchimento do Q1 encerra em 3 dias.' })
  @IsString()
  @MinLength(10, { message: 'A mensagem deve ter no mínimo 10 caracteres.' })
  mensagem: string;

  @ApiProperty({ enum: TipoNotificacao, example: 'AVISO_GERAL' })
  @IsEnum(TipoNotificacao, { message: 'Tipo de notificação inválido.' })
  tipo: TipoNotificacao;

  @ApiProperty({ required: false, example: 'uuid-do-nucleo' })
  @IsUUID()
  @IsOptional()
  nucleoId?: string;

  @ApiProperty({ required: false, enum: Role })
  @IsEnum(Role)
  @IsOptional()
  perfilAlvo?: Role;

  @ApiProperty({ required: false, example: ['uuid-user-1', 'uuid-user-2'] })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  destinatarioIds?: string[];
}