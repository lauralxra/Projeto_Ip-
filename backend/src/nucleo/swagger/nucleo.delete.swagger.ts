import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
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
        'ADMINISTRADOR (RN26.01). Na mesma transação, arquiva (status ARQUIVADO) os programas e ' +
        'indicadores vinculados e desvincula os usuários do núcleo. Cada arquivamento e a ' +
        'exclusão são registrados na auditoria (RNF15).',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'Identificador do núcleo (UUID)',
      format: 'uuid',
    }),
    ApiOkResponse({
      description: 'Núcleo excluído com sucesso.',
      schema: {
        example: { message: 'Núcleo excluído com sucesso.' },
      },
    }),
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
