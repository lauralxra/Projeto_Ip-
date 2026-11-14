import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaExceptionFilter } from '../common/filters/prisma-exception.filter';
import { AuthenticatedRequest } from '../auth/interface/request.interface';

// Simula o JwtAuthGuard: sem x-test-token, 401; o perfil vem do header x-test-role
class FakeJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.headers['x-test-token']) throw new UnauthorizedException();
    req.user = { id: 'user-uuid', role: req.headers['x-test-role'] as Role };
    return true;
  }
}

describe('DashboardController (HTTP)', () => {
  let app: INestApplication<App>;
  let dashboardService: { findIndicadores: jest.Mock };
  const vazio = { ano: 2026, trimestre: null, total: 0, indicadores: [] };

  const get = (role?: Role) => {
    const req = request(app.getHttpServer())
      .get('/dashboard/indicators')
      .set('x-test-token', 'ok');
    return role ? req.set('x-test-role', role) : req;
  };

  beforeEach(async () => {
    dashboardService = { findIndicadores: jest.fn().mockResolvedValue(vazio) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
        { provide: APP_FILTER, useClass: PrismaExceptionFilter },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile();

    app = module.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('sem token válido retorna 401', async () => {
    await request(app.getHttpServer()).get('/dashboard/indicators').expect(401);

    expect(dashboardService.findIndicadores).not.toHaveBeenCalled();
  });

  it('usuário sem perfil de acesso retorna 403', async () => {
    await get().expect(403);

    expect(dashboardService.findIndicadores).not.toHaveBeenCalled();
  });

  it('Diretor que solicita núcleo sem vínculo recebe 403', async () => {
    dashboardService.findIndicadores.mockRejectedValue(
      new ForbiddenException(
        'Você não possui acesso aos indicadores deste núcleo.',
      ),
    );

    await get(Role.DIRETORES_NUCLEOS)
      .query({ nucleoId: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
      .expect(403);
  });

  it.each([
    Role.ADMINISTRADOR,
    Role.DIRETORES_NUCLEOS,
    Role.EQUIPE_GESTAO,
    Role.EQUIPE_COMUNICACAO,
  ])(
    'perfil %s recebe 200 com o usuário repassado ao service',
    async (role) => {
      await get(role).expect(200).expect(vazio);

      expect(dashboardService.findIndicadores).toHaveBeenCalledWith(
        expect.objectContaining({ ano: new Date().getFullYear() }),
        { id: 'user-uuid', role },
      );
    },
  );

  it('converte os filtros da query', async () => {
    await get(Role.ADMINISTRADOR)
      .query({
        ano: '2025',
        trimestre: 'Q4',
        nucleoId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        indicadorId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        programaId: '3fa85f64-5717-4562-b3fc-2c963f66afa8',
        acaoId: '3fa85f64-5717-4562-b3fc-2c963f66afa9',
        status: 'APROVADO',
      })
      .expect(200);

    expect(dashboardService.findIndicadores).toHaveBeenCalledWith(
      {
        ano: 2025,
        trimestre: 'Q4',
        nucleoId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        indicadorId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        programaId: '3fa85f64-5717-4562-b3fc-2c963f66afa8',
        acaoId: '3fa85f64-5717-4562-b3fc-2c963f66afa9',
        status: 'APROVADO',
      },
      expect.anything(),
    );
  });

  it.each([
    { ano: '1999' },
    { trimestre: 'Q5' },
    { nucleoId: '123' },
    { indicadorId: '123' },
    { programaId: '123' },
    { acaoId: '123' },
    { status: 'INVALIDO' },
  ])('filtro inválido %o retorna 400', async (query) => {
    await get(Role.ADMINISTRADOR).query(query).expect(400);

    expect(dashboardService.findIndicadores).not.toHaveBeenCalled();
  });

  it('banco indisponível retorna 503 padronizado', async () => {
    dashboardService.findIndicadores.mockRejectedValue(
      new Prisma.PrismaClientInitializationError(
        "Can't reach database server",
        'test',
      ),
    );

    await get(Role.ADMINISTRADOR).expect(503).expect({
      statusCode: 503,
      message: 'Banco de dados indisponível. Tente novamente mais tarde.',
      error: 'Service Unavailable',
    });
  });

  it('erro inesperado do banco retorna 500 sem expor detalhes', async () => {
    dashboardService.findIndicadores.mockRejectedValue(
      new Prisma.PrismaClientUnknownRequestError('detalhe interno do SQL', {
        clientVersion: 'test',
      }),
    );

    const resposta = await get(Role.ADMINISTRADOR).expect(500);

    expect(resposta.body).toEqual({
      statusCode: 500,
      message: 'Erro interno ao acessar o banco de dados.',
      error: 'Internal Server Error',
    });
  });

  describe('RN01: o tipo de gráfico não altera os dados', () => {
    it.each(['tipoGrafico', 'chartType', 'tipo'])(
      'rejeita o parâmetro de visualização %s (a troca é só no cliente)',
      async (parametro) => {
        await get(Role.ADMINISTRADOR)
          .query({ [parametro]: 'pizza' })
          .expect(400);

        expect(dashboardService.findIndicadores).not.toHaveBeenCalled();
      },
    );

    it('devolve o mesmo payload para os mesmos filtros', async () => {
      const resposta = {
        ano: 2026,
        trimestre: null,
        total: 1,
        indicadores: [
          {
            id: 'ind-1',
            codigo: 'IND-001',
            nome: 'Pessoas atendidas',
            tipoDado: 'NUMERICO',
            unidadeMedida: 'pessoas',
            escopo: 'NUCLEO',
            nucleo: null,
            meta: 1200,
            realizado: 950,
            percentualAtingido: 79.2,
            registros: [
              {
                trimestre: 'Q1',
                valorRealizado: 950,
                metaAplicada: 300,
                statusAprovacao: 'APROVADO',
              },
            ],
          },
        ],
      };
      dashboardService.findIndicadores.mockResolvedValue(resposta);

      const primeira = await get(Role.ADMINISTRADOR).expect(200);
      const segunda = await get(Role.ADMINISTRADOR).expect(200);

      expect(primeira.body).toEqual(resposta);
      expect(segunda.body).toEqual(primeira.body);
    });
  });
});
