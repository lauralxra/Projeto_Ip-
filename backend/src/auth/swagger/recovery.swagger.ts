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
    'Limite de 5 tentativas excedido para o código atual (é preciso solicitar um novo código), ou mais de 20 requisições de recuperação pelo mesmo IP em 15 minutos.',
});

const LIMITE_POR_IP = ApiTooManyRequestsResponse({
  description:
    'Mais de 20 requisições de recuperação de senha pelo mesmo IP em 15 minutos.',
});

const LIMITE_POR_CONTA =
  ' Por conta, gera no máximo 3 códigos por hora, com intervalo mínimo de 60 segundos; acima disso responde igual, sem gerar código nem enviar e-mail.';

export function RecoveryRequestSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Solicitar código de recuperação de senha (UC02)',
      description:
        'Envia um código de 6 dígitos, válido por 15 minutos, ao e-mail de uma conta ativa e invalida códigos anteriores. A resposta é sempre a mesma, exista ou não a conta.' +
        LIMITE_POR_CONTA,
    }),
    ApiOkResponse({ schema: { example: MENSAGEM_GENERICA } }),
    ApiBadRequestResponse({ description: 'E-mail em formato inválido.' }),
    LIMITE_POR_IP,
  );
}

export function RecoveryResendSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reenviar código de recuperação de senha (UC02, RN07)',
      description:
        'Gera um novo código e invalida o anterior. A resposta é sempre a mesma, exista ou não a conta.' +
        LIMITE_POR_CONTA,
    }),
    ApiOkResponse({ schema: { example: MENSAGEM_GENERICA } }),
    ApiBadRequestResponse({ description: 'E-mail em formato inválido.' }),
    LIMITE_POR_IP,
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
        'Valida o código e as regras da nova senha (RN05, RN06) e, numa única transação, troca a senha, consome o código, desbloqueia a conta (zera as tentativas de login), encerra as sessões abertas e registra a auditoria (RN08).',
    }),
    ApiOkResponse({
      schema: { example: { message: 'Senha redefinida com sucesso.' } },
    }),
    CODIGO_INVALIDO,
    TENTATIVAS_EXCEDIDAS,
  );
}
