import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
      providers: [{ provide: DashboardService, useValue: dashboardService }],
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
      })
      .expect(200);

    expect(dashboardService.findIndicadores).toHaveBeenCalledWith(
      {
        ano: 2025,
        trimestre: 'Q4',
        nucleoId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
      expect.anything(),
    );
  });

  it.each([
    { ano: '1999' },
    { trimestre: 'Q5' },
    { nucleoId: '123' },
    { status: 'APROVADO' },
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

    await get(Role.ADMINISTRADOR).expect(503);
  });
});
