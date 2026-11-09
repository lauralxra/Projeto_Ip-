import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserPermissionsDto {
  @ApiProperty({
    example: 'DIRETORES_NUCLEOS',
    description: 'Novo perfil do usuário',
    enum: Role,
    required: false,
  })
  @IsEnum(Role, { message: 'Perfil inválido.' })
  @IsOptional()
  role?: Role;

  @ApiProperty({
    example: ['uuid-nucleo-1', 'uuid-nucleo-2'],
    description: 'IDs dos núcleos a associar ao usuário',
    required: false,
  })
  @IsArray({ message: 'nucleoIds deve ser uma lista.' })
  @IsUUID('all', {
    each: true,
    message: 'Cada nucleoId deve ser um UUID válido.',
  })
  @IsOptional()
  nucleoIds?: string[];
}
