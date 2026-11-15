import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthErrorResponseDto } from '../../auth/dto/auth-response.dto';

export function ContagemUsuariosSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Contar usuários ativos',
      description: 'Retorna o total de usuários ativos e não excluídos.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'Total de usuários ativos.',
      schema: { type: 'number', example: 42 },
    }),
    ApiUnauthorizedResponse({
      description: 'Token de acesso ausente, inválido ou expirado.',
      type: AuthErrorResponseDto,
    }),
  );
}
