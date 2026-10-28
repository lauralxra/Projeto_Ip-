import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function LogoutSwagger() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Encerrar sessão (Logout)',
      description:
        'Registra o encerramento da sessão na auditoria e remove o cookie de autenticação do cliente.',
    }),
    ApiOkResponse({
      description: 'Sessão encerrada com sucesso.',
      schema: {
        example: { message: 'Sessão encerrada com sucesso' },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Token de acesso ausente, inválido ou expirado.',
    }),
  );
}
