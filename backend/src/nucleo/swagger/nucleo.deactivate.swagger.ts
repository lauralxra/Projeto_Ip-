import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthErrorResponseDto } from '../../auth/dto/auth-response.dto';

export function DeactivateNucleoSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Desativar núcleo',
      description:
        'Altera o status do núcleo para INATIVO, preservando o registro e seus vínculos. Restrito ao perfil ADMINISTRADOR. A ação é registrada na auditoria.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'Identificador do núcleo (UUID)',
      format: 'uuid',
    }),
    ApiNoContentResponse({ description: 'Núcleo desativado com sucesso.' }),
    ApiUnauthorizedResponse({
      description: 'Token ausente, inválido ou expirado.',
      type: AuthErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'O usuário não tem perfil ADMINISTRADOR.',
      type: AuthErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Núcleo inexistente ou já desativado.',
      type: AuthErrorResponseDto,
    }),
  );
}
