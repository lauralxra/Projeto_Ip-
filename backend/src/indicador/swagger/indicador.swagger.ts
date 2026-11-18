import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthErrorResponseDto } from '../../auth/dto/auth-response.dto';

const naoAutenticado = ApiUnauthorizedResponse({
  description: 'Token de acesso ausente, inválido ou expirado.',
  type: AuthErrorResponseDto,
});

export function FindAllIndicadoresSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar indicadores ativos (RF04)',
      description:
        'Administração e Comunicação veem todos os núcleos; os demais perfis veem os institucionais e os dos seus núcleos. A Comunicação recebe apenas registros aprovados ou publicados.',
    }),
    ApiOkResponse({ description: 'Lista de indicadores com seus registros.' }),
    naoAutenticado,
  );
}

export function CreateIndicadorSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Cadastrar indicador (RF01, RF05–RF07)' }),
    ApiCreatedResponse({ description: 'Indicador criado e auditado.' }),
    ApiBadRequestResponse({
      description:
        'Dados inválidos, núcleo/programa inexistente ou escopo incompatível com o núcleo.',
      type: AuthErrorResponseDto,
    }),
    naoAutenticado,
    ApiForbiddenResponse({
      description: 'Apenas a administração cadastra indicadores.',
      type: AuthErrorResponseDto,
    }),
  );
}

export function RemoveIndicadorSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Excluir um indicador (RF03)',
      description:
        'Exclusão lógica do indicador e dos seus registros e metas. A ação é registrada na auditoria.',
    }),
    ApiOkResponse({ description: 'Indicador excluído.' }),
    naoAutenticado,
    ApiForbiddenResponse({
      description: 'Apenas a administração exclui indicadores.',
      type: AuthErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Indicador não encontrado ou já excluído.',
      type: AuthErrorResponseDto,
    }),
  );
}

export function SalvarRegistroSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Registrar o valor de um trimestre (RF08, RF09)',
      description:
        'Cria ou atualiza o valor do indicador no ano/trimestre. A Direção de Núcleo só registra nos indicadores do próprio núcleo e enquanto o valor não foi enviado para revisão. Alterar um valor aprovado ou publicado devolve o registro para revisão.',
    }),
    ApiCreatedResponse({ description: 'Registro salvo e auditado.' }),
    ApiBadRequestResponse({
      description: 'Ano, trimestre ou valor inválido.',
      type: AuthErrorResponseDto,
    }),
    naoAutenticado,
    ApiForbiddenResponse({
      description: 'Perfil sem permissão ou indicador de outro núcleo.',
      type: AuthErrorResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Indicador não encontrado ou inativo.',
      type: AuthErrorResponseDto,
    }),
    ApiConflictResponse({
      description:
        'O valor já foi enviado para revisão e o núcleo não pode alterá-lo.',
      type: AuthErrorResponseDto,
    }),
  );
}
