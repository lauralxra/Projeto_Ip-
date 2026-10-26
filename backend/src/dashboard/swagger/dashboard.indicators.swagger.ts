import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthErrorResponseDto } from '../../auth/dto/auth-response.dto';
import { DashboardIndicadoresResponseDto } from '../dto/dashboard-indicadores-response.dto';

export function DashboardIndicadoresSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Indicadores do dashboard',
      description:
        'Agrega metas e medições dos indicadores no ano (ou trimestre) e compara o realizado com a meta. ' +
        'ADMINISTRADOR vê todos os indicadores e medições (RN03); DIRETORES_NUCLEOS vê apenas os ' +
        'indicadores dos seus núcleos (RN02); EQUIPE_COMUNICACAO e EQUIPE_GESTAO veem apenas medições ' +
        'APROVADO ou PUBLICADO (RN01). Sem indicadores disponíveis, retorna a lista vazia.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'Indicadores visíveis para o perfil, com metas e medições.',
      type: DashboardIndicadoresResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Filtros inválidos: ano fora de 2000–2100, trimestre desconhecido ou núcleo fora do formato UUID.',
      type: AuthErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Token de acesso ausente, inválido ou expirado.',
      type: AuthErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'O usuário autenticado não possui perfil de acesso.',
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
