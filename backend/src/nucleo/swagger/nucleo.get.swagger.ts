import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthErrorResponseDto } from '../../auth/dto/auth-response.dto';
import { NucleoPaginadoResponseDto } from '../dto/nucleo-response.dto';

export function SearchNucleoSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Pesquisar núcleos',
      description:
        'Pesquisa núcleos não excluídos por termo, programa, estado, data de criação ou ano/trimestre, ' +
        'com resultados paginados e ordenados por nome. ADMINISTRADOR e EQUIPE_COMUNICACAO pesquisam ' +
        'todos os núcleos (RN01); DIRETORES_NUCLEOS e EQUIPE_GESTAO recebem apenas os núcleos aos ' +
        'quais estão vinculados (RN02).',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'Página de núcleos que atendem aos filtros.',
      type: NucleoPaginadoResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Filtros inválidos: programa fora do formato UUID, estado ou trimestre desconhecidos, datas fora do ' +
        'formato AAAA-MM-DD ou invertidas, trimestre sem ano, ou paginação fora dos limites.',
      type: AuthErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Token de acesso ausente, inválido ou expirado.',
      type: AuthErrorResponseDto,
    }),
    ApiInternalServerErrorResponse({
      description: 'Erro interno ao acessar o banco de dados.',
      type: AuthErrorResponseDto,
    }),
    ApiServiceUnavailableResponse({
      description: 'Banco de dados indisponível no momento.',
      type: AuthErrorResponseDto,
    }),
  );
}
