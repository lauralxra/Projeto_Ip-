import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  Prisma,
  Role,
  StatusAprovacao,
  TipoDadoIndicador,
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/interface/request.interface';
import { FilterDashboardDto } from './dto/filter-dashboard.dto';
import {
  DashboardIndicadorDto,
  DashboardIndicadoresResponseDto,
} from './dto/dashboard-indicadores-response.dto';
import {
  DashboardRepository,
  IndicadorDashboard,
} from './dashboard.repository';

// RN01: Equipe de Comunicação e Equipe de Gestão só enxergam medições aprovadas ou publicadas
const PERFIS_SOMENTE_APROVADOS: Role[] = [
  Role.EQUIPE_COMUNICACAO,
  Role.EQUIPE_GESTAO,
];
const STATUS_VISIVEIS: StatusAprovacao[] = [
  StatusAprovacao.APROVADO,
  StatusAprovacao.PUBLICADO,
];
const STATUS_RESTRITOS_ADMIN: StatusAprovacao[] = [
  StatusAprovacao.PENDENTE,
  StatusAprovacao.EM_PREENCHIMENTO,
  StatusAprovacao.NECESSITA_CORRECAO,
];

const paraNumero = (valor: Prisma.Decimal | null) =>
  valor === null ? null : valor.toNumber();

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async findIndicadores(
    filtros: FilterDashboardDto,
    usuario: AuthenticatedUser,
  ): Promise<DashboardIndicadoresResponseDto> {
    const {
      ano,
      trimestre,
      nucleoId,
      indicadorId,
      programaId,
      acaoId,
      status,
    } = filtros;
    const somenteAprovados = PERFIS_SOMENTE_APROVADOS.includes(usuario.role);
    const statusVisiveis = somenteAprovados
      ? status
        ? STATUS_VISIVEIS.filter((statusVisivel) => statusVisivel === status)
        : STATUS_VISIVEIS
      : status
        ? [status]
        : undefined;

    if (
      status &&
      STATUS_RESTRITOS_ADMIN.includes(status) &&
      usuario.role !== Role.ADMINISTRADOR
    ) {
      throw new ForbiddenException(
        'Somente a Administração pode filtrar medições por este status.',
      );
    }

    if (
      usuario.role === Role.DIRETORES_NUCLEOS &&
      (nucleoId || indicadorId || programaId || acaoId) &&
      !(await this.dashboardRepository.usuarioPodeAcessarFiltros(usuario.id, {
        nucleoId,
        indicadorId,
        programaId,
        acaoId,
      }))
    ) {
      throw new ForbiddenException(
        'Você não possui acesso aos indicadores deste núcleo.',
      );
    }

    const registros: Prisma.IndicadorRegistroWhereInput = {
      deletedAt: null,
      ano,
      ...(trimestre && { trimestre }),
      ...(statusVisiveis && { statusAprovacao: { in: statusVisiveis } }),
    };

    // RN03: a Administradora não tem restrição além dos filtros pedidos
    const where: Prisma.IndicadorWhereInput = {
      deletedAt: null,
      ...(nucleoId && { nucleoId }),
      ...(indicadorId && { id: indicadorId }),
      ...(programaId && { programaId }),
      ...(acaoId && { acaoId }),
    };

    // RN02: Diretores de Núcleo só veem indicadores dos núcleos aos quais estão vinculados
    if (usuario.role === Role.DIRETORES_NUCLEOS) {
      where.nucleo = { users: { some: { userId: usuario.id } } };
    }

    // RN01: sem medição aprovada ou publicada no período, o indicador não aparece
    if (somenteAprovados) {
      where.registros = { some: registros };
    }

    const indicadores = await this.dashboardRepository.findIndicadores({
      where,
      registros,
      ano,
      trimestreMeta: trimestre ?? null,
    });

    return {
      ano,
      trimestre: trimestre ?? null,
      total: indicadores.length,
      indicadores: indicadores.map(consolidar),
    };
  }
}

// Compara o realizado no período com a meta (anual ou do trimestre filtrado)
function consolidar(indicador: IndicadorDashboard): DashboardIndicadorDto {
  const { metas, registros, ...dados } = indicador;
  const meta = paraNumero(metas[0]?.valorMeta ?? null);
  const realizado = calcularRealizado(indicador.tipoDado, registros);

  return {
    ...dados,
    meta,
    realizado,
    percentualAtingido:
      meta && realizado !== null
        ? Math.round((realizado / meta) * 1000) / 10
        : null,
    registros: registros.map((registro) => ({
      ...registro,
      valorRealizado: paraNumero(registro.valorRealizado),
      metaAplicada: paraNumero(registro.metaAplicada),
    })),
  };
}

// Percentuais não se somam: vale a última medição informada; os demais tipos acumulam
function calcularRealizado(
  tipoDado: TipoDadoIndicador,
  registros: IndicadorDashboard['registros'],
) {
  const valores = registros
    .map((registro) => registro.valorRealizado)
    .filter((valor): valor is Prisma.Decimal => valor !== null);

  if (valores.length === 0) return null;
  if (tipoDado === TipoDadoIndicador.PERCENTUAL) {
    return valores[valores.length - 1].toNumber();
  }
  return valores
    .reduce((soma, valor) => soma.plus(valor), new Prisma.Decimal(0))
    .toNumber();
}
