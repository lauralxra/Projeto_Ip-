import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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
      summary: 'Atualizar nome e e-mail de um usuário (Administração)',
      description:
        'A Administração altera o nome e/ou o e-mail de qualquer usuário. O e-mail precisa ser único entre os usuários não excluídos. A alteração é registrada na auditoria.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'Dados atualizados com sucesso.',
      type: PublicUserResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Dados inválidos, nenhuma alteração ou campo adicional enviado.',
      type: AuthErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Token de acesso ausente, inválido ou expirado.',
      type: AuthErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'Somente a Administração pode editar usuários.',
      type: AuthErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Usuário não encontrado ou excluído.',
      type: AuthErrorResponseDto,
    }),
    ApiConflictResponse({
      description: 'Já existe um usuário cadastrado com este e-mail.',
      type: AuthErrorResponseDto,
    }),
  );
}
