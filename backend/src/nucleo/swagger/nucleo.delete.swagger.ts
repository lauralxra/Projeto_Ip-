import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthErrorResponseDto } from '../../auth/dto/auth-response.dto';

export function DeleteNucleoSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Excluir núcleo',
      description:
        'Exclui logicamente um núcleo, que deixa de ser retornado nas consultas. Restrito ao perfil ' +
        'ADMINISTRADOR (RN26.01). Bloqueada enquanto houver usuários, programas ou indicadores ' +
        'vinculados. A exclusão é registrada na auditoria (RNF15).',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'Identificador do núcleo (UUID)',
      format: 'uuid',
    }),
    ApiNoContentResponse({ description: 'Núcleo excluído com sucesso.' }),
    ApiBadRequestResponse({
      description: 'O id informado não é um UUID válido.',
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
    ApiNotFoundResponse({
      description: 'Núcleo inexistente ou já excluído.',
      type: AuthErrorResponseDto,
    }),
    ApiConflictResponse({
      description:
        'O núcleo possui usuários, programas ou indicadores vinculados.',
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
