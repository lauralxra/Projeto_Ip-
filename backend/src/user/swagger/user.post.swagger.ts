import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthErrorResponseDto,
  PublicUserResponseDto,
} from '../../auth/dto/auth-response.dto';

export function CreateUserSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cadastrar usuário (administração)',
      description:
        'Cadastra um novo usuário já ativo e com o perfil informado. ' +
        'Restrito a usuários com perfil ADMINISTRADOR. A senha é gravada com hash bcrypt ' +
        'e a criação é registrada na auditoria.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiCreatedResponse({
      description: 'Usuário cadastrado com sucesso (sem hash de senha).',
      type: PublicUserResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Dados inválidos: campo obrigatório vazio, e-mail malformado, senha fraca ou confirmação diferente.',
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
      description: 'Já existe um usuário cadastrado com este e-mail.',
      type: AuthErrorResponseDto,
    }),
  );
}
