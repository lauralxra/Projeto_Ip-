import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcaoAuditoria,
  EscopoIndicador,
  Prisma,
  Role,
  StatusRegistro,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';
import type { AuthenticatedUser } from '../auth/interface/request.interface';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { FilterRegistroDto } from './dto/filter-registro.dto';
import {
  alterarValorRegistro,
  STATUS_VISIVEIS_COMUNICACAO,
  valorParaAuditoria,
} from './regras-registro';

// RF12: dados do indicador exibidos junto do valor, incluindo o tipo do dado
const INCLUDE_INDICADOR = {
  indicador: {
    select: {
      id: true,
      nome: true,
      codigo: true,
      unidadeMedida: true,
      tipoDado: true,
      escopo: true,
      nucleoId: true,
      nucleo: { select: { id: true, nome: true, sigla: true } },
    },
  },
} satisfies Prisma.IndicadorRegistroInclude;

const PERFIS_SOMENTE_HOMOLOGADOS: Role[] = [
  Role.EQUIPE_COMUNICACAO,
  Role.EQUIPE_GESTAO,
];

type MudancaStatus = {
  de: StatusRegistro;
  para: StatusRegistro;
  acao: AcaoAuditoria;
  jaEsta: string;
};

const INATIVAR: MudancaStatus = {
  de: StatusRegistro.ATIVO,
  para: StatusRegistro.INATIVO,
  acao: AcaoAuditoria.DESATIVAR,
  jaEsta: 'O registro já está inativo.',
};
const REATIVAR: MudancaStatus = {
  de: StatusRegistro.INATIVO,
  para: StatusRegistro.ATIVO,
  acao: AcaoAuditoria.RESTAURAR,
  jaEsta: 'O registro já está ativo.',
};

@Injectable()
export class RegistroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async nucleosDoUsuario(userId: string): Promise<string[]> {
    const vinculos = await this.prisma.userNucleo.findMany({
      where: { userId },
      select: { nucleoId: true },
    });
    return vinculos.map((v) => v.nucleoId);
  }

  // Mesmo alcance do dashboard (RN01): Comunicação e Gestão veem todos os núcleos,
  // só valores homologados; a Direção de Núcleo vê os indicadores institucionais e os
  // dos seus núcleos, em qualquer status. Só a Administração vê registros inativos.
  private async filtroVisibilidade(
    usuario: AuthenticatedUser,
  ): Promise<Prisma.IndicadorRegistroWhereInput> {
    if (usuario.role === Role.ADMINISTRADOR) {
      return { deletedAt: null };
    }

    const indicadorVisivel: Prisma.IndicadorWhereInput = {
      deletedAt: null,
      status: StatusRegistro.ATIVO,
    };
    const base: Prisma.IndicadorRegistroWhereInput = {
      deletedAt: null,
      status: StatusRegistro.ATIVO,
    };

    if (PERFIS_SOMENTE_HOMOLOGADOS.includes(usuario.role)) {
      return {
        ...base,
        statusAprovacao: { in: STATUS_VISIVEIS_COMUNICACAO },
        indicador: indicadorVisivel,
      };
    }

    const nucleos = await this.nucleosDoUsuario(usuario.id);
    return {
      ...base,
      indicador: {
        ...indicadorVisivel,
        OR: [
          { escopo: EscopoIndicador.INSTITUCIONAL },
          { nucleoId: { in: nucleos } },
        ],
      },
    };
  }

  async findAll(filtros: FilterRegistroDto, usuario: AuthenticatedUser) {
    const { pagina, limite } = filtros;

    // Padrão ATIVO para todos; inativos só sob pedido explícito do administrador
    const status = filtros.status ?? StatusRegistro.ATIVO;
    if (
      status !== StatusRegistro.ATIVO &&
      usuario.role !== Role.ADMINISTRADOR
    ) {
      throw new ForbiddenException(
        'Somente o administrador pode consultar registros inativos.',
      );
    }

    const where: Prisma.IndicadorRegistroWhereInput = {
      AND: [
        await this.filtroVisibilidade(usuario),
        {
          ...(filtros.indicadorId && { indicadorId: filtros.indicadorId }),
          ...(filtros.ano && { ano: filtros.ano }),
          ...(filtros.trimestre && { trimestre: filtros.trimestre }),
          ...(filtros.statusAprovacao && {
            statusAprovacao: filtros.statusAprovacao,
          }),
          status,
        },
      ],
    };

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.indicadorRegistro.findMany({
        where,
        include: INCLUDE_INDICADOR,
        orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }, { id: 'asc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.indicadorRegistro.count({ where }),
    ]);

    return { itens, total, pagina, limite };
  }

  async findOne(id: string, usuario: AuthenticatedUser) {
    const registro = await this.prisma.indicadorRegistro.findFirst({
      where: { AND: [{ id }, await this.filtroVisibilidade(usuario)] },
      include: INCLUDE_INDICADOR,
    });

    // 404 também quando o registro existe mas está fora do alcance do usuário,
    // para não revelar a existência de dados de outros núcleos
    if (!registro) {
      throw new NotFoundException('Registro não encontrado.');
    }

    return registro;
  }

  // RF09: altera o valor realizado com as mesmas regras de POST /indicadores/:id/registros
  async update(
    id: string,
    dados: UpdateRegistroDto,
    usuario: AuthenticatedUser,
    ip?: string,
  ) {
    const existente = await this.prisma.indicadorRegistro.findFirst({
      where: { id, deletedAt: null },
      include: {
        indicador: {
          select: { nucleoId: true, deletedAt: true, status: true },
        },
      },
    });

    if (!existente || existente.indicador.deletedAt) {
      throw new NotFoundException('Registro não encontrado.');
    }

    if (existente.indicador.status !== StatusRegistro.ATIVO) {
      throw new ConflictException(
        'Não é possível alterar valores de um indicador inativo.',
      );
    }

    // RN02: Direção de Núcleo só altera indicadores do próprio núcleo;
    // indicadores institucionais ficam com a administração
    if (usuario.role !== Role.ADMINISTRADOR) {
      const nucleos = await this.nucleosDoUsuario(usuario.id);
      if (
        !existente.indicador.nucleoId ||
        !nucleos.includes(existente.indicador.nucleoId)
      ) {
        throw new ForbiddenException(
          'Você só pode alterar registros de indicadores do seu núcleo.',
        );
      }
    }

    await alterarValorRegistro(
      this.prisma,
      this.audit,
      existente,
      dados.valorRealizado,
      usuario,
      ip,
    );

    return this.prisma.indicadorRegistro.findUnique({
      where: { id },
      include: INCLUDE_INDICADOR,
    });
  }

  // RF11: inativa sem excluir; o dado sai dos cálculos e fica no histórico (RN06)
  inativar(id: string, autor: AutorAcao) {
    return this.alterarStatus(id, INATIVAR, autor);
  }

  reativar(id: string, autor: AutorAcao) {
    return this.alterarStatus(id, REATIVAR, autor);
  }

  // RF10: exclusão lógica do registro (RN07)
  async remove(id: string, autor: AutorAcao) {
    const registro = await this.prisma.indicadorRegistro.findFirst({
      where: { id, deletedAt: null },
      select: {
        indicadorId: true,
        ano: true,
        trimestre: true,
        valorRealizado: true,
        statusAprovacao: true,
        status: true,
      },
    });

    if (!registro) {
      throw new NotFoundException('Registro não encontrado.');
    }

    // O filtro em deletedAt evita excluir (e auditar) duas vezes em requisições concorrentes
    const { count } = await this.prisma.indicadorRegistro.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), status: StatusRegistro.INATIVO },
    });
    if (count === 0) {
      throw new NotFoundException('Registro não encontrado.');
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.EXCLUIR_LOGICO,
      entidade: 'IndicadorRegistro',
      entidadeId: id,
      dadosAntigos: {
        ...registro,
        valorRealizado: valorParaAuditoria(registro.valorRealizado),
      },
      dadosNovos: { excluido: true },
      ip: autor.ip,
    });

    return { message: 'Registro excluído com sucesso.' };
  }

  private async alterarStatus(
    id: string,
    mudanca: MudancaStatus,
    autor: AutorAcao,
  ) {
    // Atualiza só se o status ainda for o esperado: evita auditar duas vezes
    const { count } = await this.prisma.indicadorRegistro.updateMany({
      where: { id, deletedAt: null, status: mudanca.de },
      data: { status: mudanca.para },
    });

    if (count === 0) {
      const existe = await this.prisma.indicadorRegistro.findFirst({
        where: { id, deletedAt: null },
        select: { id: true },
      });
      if (!existe) {
        throw new NotFoundException('Registro não encontrado.');
      }
      throw new ConflictException(mudanca.jaEsta);
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: mudanca.acao,
      entidade: 'IndicadorRegistro',
      entidadeId: id,
      dadosAntigos: { status: mudanca.de },
      dadosNovos: { status: mudanca.para },
      ip: autor.ip,
    });

    return this.prisma.indicadorRegistro.findUnique({
      where: { id },
      include: INCLUDE_INDICADOR,
    });
  }
}
