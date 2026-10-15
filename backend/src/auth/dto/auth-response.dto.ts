import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class PublicUserResponseDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'Identificador único do usuário no formato UUID v4',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    example: 'Maria da Silva',
    description: 'Nome completo do usuário cadastrado',
  })
  nome!: string;

  @ApiProperty({
    example: 'maria@instituto-ipe.org.br',
    description: 'Endereço de e-mail institucional normalizado',
    format: 'email',
  })
  email!: string;

  @ApiProperty({
    enum: Role,
    nullable: true,
    example: Role.ADMINISTRADOR,
    description:
      'Perfil de acesso atribuído ao usuário. Nulo até aprovação da administração.',
  })
  perfil!: Role | null;

  @ApiProperty({
    example: false,
    description:
      'Indica se o usuário está ativo no sistema e com permissão para efetuar login',
  })
  ativo!: boolean;

  @ApiProperty({
    example: '2026-10-13T15:00:00.000Z',
    description: 'Data e horário de criação do cadastro (ISO 8601)',
  })
  createdAt!: Date;
}

export class RegisterResponseDto {
  @ApiProperty({
    example:
      'Cadastro realizado. Aguarde a liberação de acesso pela administração.',
    description: 'Mensagem informativa com as instruções de liberação da conta',
  })
  message!: string;

  @ApiProperty({
    type: PublicUserResponseDto,
    description: 'Dados públicos do usuário recém-criado (sem hash de senha)',
  })
  user!: PublicUserResponseDto;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZmE4NWY2NC...',
    description:
      'Token de acesso JWT contendo identificador (sub) e perfil de acesso (role)',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'Tipo do token de autenticação HTTP',
  })
  tokenType!: string;

  @ApiProperty({
    type: PublicUserResponseDto,
    description: 'Dados do usuário autenticado',
  })
  user!: PublicUserResponseDto;
}

export class AuthErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'Código de status HTTP do erro',
  })
  statusCode!: number;

  @ApiProperty({
    example: 'O email informado não é válido.',
    description:
      'Mensagem descritiva do erro ou lista de violações de validação',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message!: string | string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'Nome padrão da exceção HTTP',
  })
  error!: string;
}
