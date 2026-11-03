import { applyDecorators } from '@nestjs/common';
import { StatusAprovacao } from '@prisma/client';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
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
        'A resposta é independente do tipo de gráfico: use realizado para comparações e registros ordenados por trimestre para séries temporais. ' +
        'O cliente pode alternar a visualização sem enviar novas requisições; não há parâmetro de tipo de gráfico. ' +
        'ADMINISTRADOR vê todos os indicadores e medições (RN03); DIRETORES_NUCLEOS vê apenas os ' +
        'indicadores dos seus núcleos (RN02); EQUIPE_COMUNICACAO e EQUIPE_GESTAO veem apenas medições ' +
        'APROVADO ou PUBLICADO (RN01). Sem indicadores disponíveis, retorna a lista vazia.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiQuery({ name: 'ano', required: false, type: Number, example: 2026 }),
    ApiQuery({
      name: 'trimestre',
      required: false,
      enum: ['Q1', 'Q2', 'Q3', 'Q4'],
    }),
    ApiQuery({
      name: 'nucleoId',
      required: false,
      type: String,
      format: 'uuid',
    }),
    ApiQuery({
      name: 'indicadorId',
      required: false,
      type: String,
      format: 'uuid',
    }),
    ApiQuery({
      name: 'programaId',
      required: false,
      type: String,
      format: 'uuid',
    }),
    ApiQuery({ name: 'acaoId', required: false, type: String, format: 'uuid' }),
    ApiQuery({ name: 'status', required: false, enum: StatusAprovacao }),
    ApiOkResponse({
      description: 'Indicadores visíveis para o perfil, com metas e medições.',
      type: DashboardIndicadoresResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Filtros inválidos: ano fora de 2000–2100, trimestre/status inválido ou identificadores fora do formato UUID.',
      type: AuthErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Token de acesso ausente, inválido ou expirado.',
      type: AuthErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description:
        'O usuário não possui perfil de acesso, tentou filtrar um núcleo sem vínculo ou solicitou status exclusivo da Administração.',
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
