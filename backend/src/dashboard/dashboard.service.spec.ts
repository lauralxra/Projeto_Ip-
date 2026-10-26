import {
  EscopoIndicador,
  Prisma,
  Role,
  StatusAprovacao,
  TipoDadoIndicador,
  TrimestreEnum,
} from '@prisma/client';
import { DashboardRepository, FiltroIndicadores } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: { findIndicadores: jest.Mock };
  const anual = { ano: 2026 };
  const usuario = (role: Role) => ({ id: 'user-uuid', role });

  const decimal = (valor: number) => new Prisma.Decimal(valor);
  const registro = (
    trimestre: TrimestreEnum,
    valorRealizado: number | null,
    statusAprovacao: StatusAprovacao = StatusAprovacao.APROVADO,
  ) => ({
    trimestre,
    valorRealizado: valorRealizado === null ? null : decimal(valorRealizado),
    metaAplicada: decimal(300),
    statusAprovacao,
  });
  const indicador = {
    id: 'indicador-uuid',
    codigo: 'IND-001',
    nome: 'Pessoas atendidas',
    tipoDado: TipoDadoIndicador.NUMERICO,
    unidadeMedida: 'pessoas',
    escopo: EscopoIndicador.NUCLEO,
    nucleo: { id: 'nucleo-uuid', nome: 'Núcleo', sigla: 'NEA', corHex: null },
    metas: [{ valorMeta: decimal(1200) }],
    registros: [
      registro(TrimestreEnum.Q1, 320),
      registro(TrimestreEnum.Q2, 630),
    ],
  };

  // filtro enviado ao repositório na última consulta
  const filtroUsado = () =>
    (repository.findIndicadores.mock.calls[0] as [FiltroIndicadores])[0];

  beforeEach(() => {
    repository = { findIndicadores: jest.fn().mockResolvedValue([]) };
    service = new DashboardService(
      repository as unknown as DashboardRepository,
    );
  });

  describe('filtros por perfil', () => {
    it('ADMINISTRADOR vê todos os indicadores e medições em qualquer status (RN03)', async () => {
      await service.findIndicadores(anual, usuario(Role.ADMINISTRADOR));

      expect(filtroUsado()).toEqual({
        where: { deletedAt: null },
        registros: { deletedAt: null, ano: 2026 },
        ano: 2026,
        trimestreMeta: null,
      });
    });

    it.each([Role.EQUIPE_COMUNICACAO, Role.EQUIPE_GESTAO])(
      '%s só vê medições aprovadas ou publicadas e indicadores que as possuem (RN01)',
      async (role) => {
        await service.findIndicadores(anual, usuario(role));

        const registros = {
          deletedAt: null,
          ano: 2026,
          statusAprovacao: {
            in: [StatusAprovacao.APROVADO, StatusAprovacao.PUBLICADO],
          },
        };
        expect(filtroUsado()).toMatchObject({
          where: { deletedAt: null, registros: { some: registros } },
          registros,
        });
        expect(filtroUsado().where.nucleo).toBeUndefined();
      },
    );

    it('DIRETORES_NUCLEOS só vê indicadores dos seus núcleos (RN02)', async () => {
      await service.findIndicadores(anual, usuario(Role.DIRETORES_NUCLEOS));

      expect(filtroUsado()).toMatchObject({
        where: {
          deletedAt: null,
          nucleo: { users: { some: { userId: 'user-uuid' } } },
        },
        registros: { deletedAt: null, ano: 2026 },
      });
      expect(filtroUsado().where.registros).toBeUndefined();
    });

    it('aplica núcleo e trimestre pedidos sem remover a restrição do perfil', async () => {
      await service.findIndicadores(
        { ano: 2026, trimestre: TrimestreEnum.Q3, nucleoId: 'nucleo-uuid' },
        usuario(Role.DIRETORES_NUCLEOS),
      );

      expect(filtroUsado()).toMatchObject({
        where: {
          nucleoId: 'nucleo-uuid',
          nucleo: { users: { some: { userId: 'user-uuid' } } },
        },
        registros: { trimestre: TrimestreEnum.Q3 },
        trimestreMeta: TrimestreEnum.Q3,
      });
    });
  });

  describe('agregação', () => {
    it('sem indicadores disponíveis devolve coleção vazia', async () => {
      await expect(
        service.findIndicadores(anual, usuario(Role.EQUIPE_COMUNICACAO)),
      ).resolves.toEqual({
        ano: 2026,
        trimestre: null,
        total: 0,
        indicadores: [],
      });
    });

    it('soma o realizado e compara com a meta', async () => {
      repository.findIndicadores.mockResolvedValue([indicador]);

      const { total, indicadores } = await service.findIndicadores(
        anual,
        usuario(Role.ADMINISTRADOR),
      );

      expect(total).toBe(1);
      expect(indicadores[0]).toEqual({
        id: 'indicador-uuid',
        codigo: 'IND-001',
        nome: 'Pessoas atendidas',
        tipoDado: TipoDadoIndicador.NUMERICO,
        unidadeMedida: 'pessoas',
        escopo: EscopoIndicador.NUCLEO,
        nucleo: indicador.nucleo,
        meta: 1200,
        realizado: 950,
        percentualAtingido: 79.2,
        registros: [
          {
            trimestre: TrimestreEnum.Q1,
            valorRealizado: 320,
            metaAplicada: 300,
            statusAprovacao: StatusAprovacao.APROVADO,
          },
          {
            trimestre: TrimestreEnum.Q2,
            valorRealizado: 630,
            metaAplicada: 300,
            statusAprovacao: StatusAprovacao.APROVADO,
          },
        ],
      });
    });

    it('para indicador percentual usa a última medição informada', async () => {
      repository.findIndicadores.mockResolvedValue([
        {
          ...indicador,
          tipoDado: TipoDadoIndicador.PERCENTUAL,
          metas: [{ valorMeta: decimal(80) }],
          registros: [
            registro(TrimestreEnum.Q1, 60),
            registro(TrimestreEnum.Q2, 70),
            registro(TrimestreEnum.Q3, null),
          ],
        },
      ]);

      const { indicadores } = await service.findIndicadores(
        anual,
        usuario(Role.ADMINISTRADOR),
      );

      expect(indicadores[0]).toMatchObject({
        realizado: 70,
        percentualAtingido: 87.5,
      });
    });

    it('sem meta ou sem medições não calcula o percentual', async () => {
      repository.findIndicadores.mockResolvedValue([
        { ...indicador, metas: [] },
        { ...indicador, id: 'sem-registros', registros: [] },
      ]);

      const { indicadores } = await service.findIndicadores(
        anual,
        usuario(Role.ADMINISTRADOR),
      );

      expect(indicadores[0]).toMatchObject({
        meta: null,
        realizado: 950,
        percentualAtingido: null,
      });
      expect(indicadores[1]).toMatchObject({
        meta: 1200,
        realizado: null,
        percentualAtingido: null,
        registros: [],
      });
    });
  });
});
