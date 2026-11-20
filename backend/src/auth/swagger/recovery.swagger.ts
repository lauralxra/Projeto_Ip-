import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

const MENSAGEM_GENERICA = {
  message: 'Se o e-mail estiver cadastrado, você receberá o código.',
};

const CODIGO_INVALIDO = ApiBadRequestResponse({
  description:
    'Dados inválidos, ou código inválido/expirado (mesma resposta para e-mail não cadastrado).',
});

const TENTATIVAS_EXCEDIDAS = ApiTooManyRequestsResponse({
  description:
    'Limite de 5 tentativas excedido para o código atual. É preciso solicitar um novo código.',
});

export function RecoveryRequestSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Solicitar código de recuperação de senha (UC02)',
      description:
        'Envia um código de 6 dígitos, válido por 15 minutos, ao e-mail de uma conta ativa e invalida códigos anteriores. A resposta é sempre a mesma, exista ou não a conta.',
    }),
    ApiOkResponse({ schema: { example: MENSAGEM_GENERICA } }),
    ApiBadRequestResponse({ description: 'E-mail em formato inválido.' }),
  );
}

export function RecoveryResendSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reenviar código de recuperação de senha (UC02, RN07)',
      description:
        'Gera um novo código e invalida o anterior. A resposta é sempre a mesma, exista ou não a conta.',
    }),
    ApiOkResponse({ schema: { example: MENSAGEM_GENERICA } }),
    ApiBadRequestResponse({ description: 'E-mail em formato inválido.' }),
  );
}

export function RecoveryValidateSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Validar código de recuperação de senha (UC02)',
      description:
        'Confere o código sem consumi-lo. Cada verificação conta como tentativa (máximo de 5 por código).',
    }),
    ApiOkResponse({ schema: { example: { valido: true } } }),
    CODIGO_INVALIDO,
    TENTATIVAS_EXCEDIDAS,
  );
}

export function RecoveryResetSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Redefinir senha com o código de recuperação (UC02)',
      description:
        'Valida o código e as regras da nova senha (RN05, RN06) e, numa única transação, troca a senha, consome o código e registra a auditoria (RN08).',
    }),
    ApiOkResponse({
      schema: { example: { message: 'Senha redefinida com sucesso.' } },
    }),
    CODIGO_INVALIDO,
    TENTATIVAS_EXCEDIDAS,
  );
}
