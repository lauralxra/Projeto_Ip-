import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthErrorResponseDto } from '../../auth/dto/auth-response.dto';
import { NucleoResponseDto } from '../dto/nucleo-response.dto';

export function CreateNucleoSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cadastrar núcleo',
      description:
        'Cadastra um novo núcleo com status ATIVO. Restrito ao perfil ADMINISTRADOR (RN26.01). ' +
        'A criação é registrada na auditoria (RNF15).',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiCreatedResponse({
      description: 'Núcleo cadastrado com sucesso.',
      type: NucleoResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Dados inválidos: nome ou sigla vazios ou longos demais, cor fora do formato #RRGGBB ou URL de imagem inválida.',
      type: AuthErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Token de acesso ausente, inválido ou expirado.',
      type: AuthErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'O usuário autenticado não tem perfil ADMINISTRADOR.',
      type: AuthErrorResponseDto,
    }),
    ApiConflictResponse({
      description: 'Já existe um núcleo cadastrado com o mesmo nome ou sigla.',
      type: AuthErrorResponseDto,
    }),
    ApiInternalServerErrorResponse({
      description: 'Erro interno ao acessar o banco de dados.',
      type: AuthErrorResponseDto,
    }),
    ApiServiceUnavailableResponse({
      description: 'Banco de dados indisponível no momento.',
      type: AuthErrorResponseDto,
    }),
  );
}
