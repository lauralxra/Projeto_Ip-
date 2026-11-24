import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthErrorResponseDto,
  LoginResponseDto,
} from '../dto/auth-response.dto';

export function LoginSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Autenticar usuário (Login)',
      description:
        'Realiza o login de um usuário cadastrado por meio de e-mail e senha. ' +
        'O sistema valida a senha utilizando bcrypt em tempo constante (mitigando timing attacks via hash fictício). ' +
        'Para obter o token JWT de acesso com sucesso, a conta precisa estar devidamente ativada e possuir um perfil (Role) ' +
        'liberado pela administração. Contas pendentes de liberação retornam status HTTP 403 Forbidden.',
    }),
    ApiOkResponse({
      description:
        'Autenticação realizada com sucesso. Retorna o token de acesso JWT (Bearer) ' +
        'com identificador (sub) e perfil (role), acompanhado dos dados do usuário.',
      type: LoginResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Dados da requisição inválidos. Ocorre quando o e-mail ou a senha não foram fornecidos ou violam as constraints do LoginDto.',
      type: AuthErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description:
        'Não autorizado. O e-mail informado não existe ou a senha fornecida está incorreta.',
      type: AuthErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description:
        'Acesso proibido. A conta do usuário existe e a senha está correta, mas o acesso ainda ' +
        'não foi ativado ou o perfil de acesso ainda não foi atribuído pela administração.',
      type: AuthErrorResponseDto,
    }),
  );
}
