import { ConflictException } from '@nestjs/common';
import {
  AcaoAuditoria,
  Prisma,
  Role,
  StatusAprovacao,
  StatusRegistro,
} from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';

// Regras do valor trimestral compartilhadas entre PATCH /registros/:id e
// POST /indicadores/:id/registros, para as duas rotas nunca divergirem

// RN01: só dado homologado chega à Comunicação
export const STATUS_VISIVEIS_COMUNICACAO: StatusAprovacao[] = [
  StatusAprovacao.APROVADO,
  StatusAprovacao.PUBLICADO,
];

// RN02: o núcleo só edita enquanto o dado não foi enviado para revisão
export const STATUS_EDITAVEIS_NUCLEO: StatusAprovacao[] = [
  StatusAprovacao.PENDENTE,
  StatusAprovacao.EM_PREENCHIMENTO,
  StatusAprovacao.NECESSITA_CORRECAO,
];

// RN04: mudar um valor já homologado devolve o dado para revisão
export const STATUS_HOMOLOGADOS: StatusAprovacao[] = [
  StatusAprovacao.APROVADO,
  StatusAprovacao.PUBLICADO,
];

export const valorParaAuditoria = (valor: Prisma.Decimal | null | undefined) =>
  valor === null || valor === undefined ? null : valor.toString();

export interface RegistroParaAlterar {
  id: string;
  valorRealizado: Prisma.Decimal | null;
  statusAprovacao: StatusAprovacao;
  status: StatusRegistro;
}

export interface UsuarioDaAlteracao {
  id: string;
  role: Role;
}

// Por que o registro não pode ter o valor alterado por este perfil (null = pode).
// Usado por alterarValorRegistro e pela importação, para as regras não divergirem.
export function bloqueioDeAlteracao(
  registro: Pick<RegistroParaAlterar, 'status' | 'statusAprovacao'>,
  role: Role,
): 'INATIVO' | 'ENVIADO_REVISAO' | null {
  // RN06: dado inativo fica preservado; precisa ser reativado antes de mudar
  if (registro.status === StatusRegistro.INATIVO) return 'INATIVO';
  // RN02: o núcleo só edita enquanto o dado não foi enviado para revisão
  if (
    role !== Role.ADMINISTRADOR &&
    !STATUS_EDITAVEIS_NUCLEO.includes(registro.statusAprovacao)
  ) {
    return 'ENVIADO_REVISAO';
  }
  return null;
}

// Campos extras gravados junto com o valor (ex.: importação em lote)
export interface ExtrasAlteracao {
  dados?: Prisma.IndicadorRegistroUpdateManyMutationInput;
  auditoria?: Record<string, unknown>;
}

// Altera o valor realizado seguindo o fluxo de aprovação. A permissão de núcleo
// (RN02) é verificada pelo chamador, que já carregou o indicador.
export async function alterarValorRegistro(
  prisma: PrismaService,
  audit: AuditService,
  registro: RegistroParaAlterar,
  valorRealizado: number | null,
  usuario: UsuarioDaAlteracao,
  ip?: string,
  extras: ExtrasAlteracao = {},
): Promise<StatusAprovacao> {
  const bloqueio = bloqueioDeAlteracao(registro, usuario.role);
  if (bloqueio === 'INATIVO') {
    throw new ConflictException(
      'Este valor está inativo e não pode ser alterado. Peça ao administrador para reativá-lo.',
    );
  }
  if (bloqueio === 'ENVIADO_REVISAO') {
    throw new ConflictException(
      'Este valor já foi enviado para revisão e não pode mais ser alterado pelo núcleo.',
    );
  }

  const eraHomologado = STATUS_HOMOLOGADOS.includes(registro.statusAprovacao);
  const novoStatus =
    eraHomologado ||
    registro.statusAprovacao === StatusAprovacao.ENVIADO_REVISAO
      ? StatusAprovacao.ENVIADO_REVISAO
      : StatusAprovacao.EM_PREENCHIMENTO;

  // Só grava se o registro ainda estiver como foi lido: se o administrador
  // aprovou ou inativou no meio tempo, a alteração não sobrescreve o dado
  const { count } = await prisma.indicadorRegistro.updateMany({
    where: {
      id: registro.id,
      deletedAt: null,
      status: StatusRegistro.ATIVO,
      statusAprovacao: registro.statusAprovacao,
    },
    data: {
      ...extras.dados,
      valorRealizado,
      responsavelId: usuario.id,
      statusAprovacao: novoStatus,
      // Um valor homologado que mudou perde a aprovação e a publicação anteriores
      ...(eraHomologado && {
        aprovadorId: null,
        revisadoEm: null,
        publicadoPorId: null,
        publicadoEm: null,
      }),
    },
  });

  if (count === 0) {
    throw new ConflictException(
      'O registro foi alterado por outra operação. Recarregue e tente novamente.',
    );
  }

  await audit.registrarAcao({
    userId: usuario.id,
    acao: AcaoAuditoria.ATUALIZAR,
    entidade: 'IndicadorRegistro',
    entidadeId: registro.id,
    dadosAntigos: {
      valorRealizado: valorParaAuditoria(registro.valorRealizado),
      statusAprovacao: registro.statusAprovacao,
    },
    dadosNovos: {
      valorRealizado,
      statusAprovacao: novoStatus,
      ...extras.auditoria,
    },
    ip,
  });

  return novoStatus;
}
