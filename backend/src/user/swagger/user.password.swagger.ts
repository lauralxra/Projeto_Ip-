import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthErrorResponseDto } from '../../auth/dto/auth-response.dto';

export function ChangePasswordSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Alterar a senha do usuário autenticado',
      description:
        'Confere a senha atual, salva a nova senha com bcrypt, registra a alteração na auditoria e envia um e-mail de aviso de segurança. A falha no envio do e-mail não desfaz a alteração.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'Senha alterada com sucesso.',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Senha alterada com sucesso.' },
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        'Nova senha fora das regras (mínimo de 8 caracteres, puramente numérica ou comum) ou confirmação diferente.',
      type: AuthErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description:
        'Senha atual incorreta, ou token de acesso ausente, inválido ou expirado.',
      type: AuthErrorResponseDto,
    }),
    ApiConflictResponse({
      description: 'A nova senha é idêntica à senha atual.',
      type: AuthErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Usuário não encontrado ou excluído.',
      type: AuthErrorResponseDto,
    }),
  );
}
