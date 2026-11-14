import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthErrorResponseDto,
  PublicUserResponseDto,
} from '../../auth/dto/auth-response.dto';

export function UpdateUserSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Atualizar nome do usuário autenticado',
      description:
        'Atualiza somente o nome do próprio usuário. A alteração é registrada na auditoria.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'Nome atualizado com sucesso.',
      type: PublicUserResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Nome inválido ou campo adicional enviado.',
      type: AuthErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Token de acesso ausente, inválido ou expirado.',
      type: AuthErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'O usuário só pode atualizar o próprio nome.',
      type: AuthErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Usuário não encontrado ou excluído.',
      type: AuthErrorResponseDto,
    }),
  );
}
