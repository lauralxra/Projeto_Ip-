import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  AuthErrorResponseDto,
  RegisterResponseDto,
} from '../dto/auth-response.dto';

export function RegisterSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cadastrar novo usuário',
      description:
        'Realiza o pré-cadastro de um novo usuário na plataforma do Instituto Ipê. ' +
        'Por padrão de segurança institucional (requisitos RF17 e RF18), a conta é criada como ' +
        'inativa (ativo: false) e sem perfil de acesso definido (perfil: null). ' +
        'O acesso ao sistema só é liberado após aprovação manual por um Administrador.',
    }),
    ApiCreatedResponse({
      description:
        'Cadastro realizado com sucesso. A conta aguarda liberação administrativa.',
      type: RegisterResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Dados de requisição inválidos. Ocorre quando algum campo do RegisterDto ' +
        'não cumpre os requisitos de validação (ex.: e-mail malformado, nome vazio ou senha com menos de 8 caracteres).',
      type: AuthErrorResponseDto,
    }),
    ApiConflictResponse({
      description:
        'Conflito de dados. Já existe um usuário ativo cadastrado com o mesmo endereço de e-mail.',
      type: AuthErrorResponseDto,
    }),
  );
}
