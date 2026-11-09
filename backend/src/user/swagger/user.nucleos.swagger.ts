import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthErrorResponseDto } from '../../auth/dto/auth-response.dto';
import { NucleoAssociadoResponseDto } from '../../nucleo/dto/nucleo-associado-response.dto';

export function NucleosAssociadosSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar núcleos associados ao usuário autenticado',
      description:
        'Retorna somente os núcleos não excluídos vinculados ao usuário do token. Disponível para DIRETORES_NUCLEOS e EQUIPE_GESTAO.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'Núcleos associados, ordenados por nome.',
      type: NucleoAssociadoResponseDto,
      isArray: true,
    }),
    ApiUnauthorizedResponse({
      description: 'Token de acesso ausente, inválido ou expirado.',
      type: AuthErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description:
        'Funcionalidade restrita aos perfis DIRETORES_NUCLEOS e EQUIPE_GESTAO.',
      type: AuthErrorResponseDto,
    }),
    ApiInternalServerErrorResponse({
      description: 'Erro interno ao acessar o banco de dados.',
      type: AuthErrorResponseDto,
    }),
  );
}
