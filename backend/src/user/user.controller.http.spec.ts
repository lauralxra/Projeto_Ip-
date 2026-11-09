import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interface/request.interface';
import { NucleoService } from '../nucleo/nucleo.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

class FakeJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = req.headers['x-test-role'] as Role | undefined;
    if (!role) throw new UnauthorizedException();
    req.user = { id: 'usuario-autenticado', role };
    return true;
  }
}

describe('GET /users/me/nucleos', () => {
  let app: INestApplication<App>;
  let nucleoService: { findAssociados: jest.Mock };

  beforeEach(async () => {
    nucleoService = {
      findAssociados: jest.fn().mockResolvedValue([
        {
          id: 'nucleo-uuid',
          nome: 'Núcleo de Educação Ambiental',
          sigla: 'NEA',
          imagemUrl: 'https://example.com/nea.png',
        },
      ]),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: {} },
        { provide: NucleoService, useValue: nucleoService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile();

    app = module.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it.each([Role.DIRETORES_NUCLEOS, Role.EQUIPE_GESTAO])(
    'permite o perfil %s e retorna seus núcleos associados',
    async (role) => {
      await request(app.getHttpServer())
        .get('/users/me/nucleos')
        .set('x-test-role', role)
        .expect(200)
        .expect([
          {
            id: 'nucleo-uuid',
            nome: 'Núcleo de Educação Ambiental',
            sigla: 'NEA',
            imagemUrl: 'https://example.com/nea.png',
          },
        ]);

      expect(nucleoService.findAssociados).toHaveBeenCalledWith(
        'usuario-autenticado',
      );
    },
  );

  it.each([Role.ADMINISTRADOR, Role.EQUIPE_COMUNICACAO])(
    'nega acesso ao perfil %s',
    async (role) => {
      await request(app.getHttpServer())
        .get('/users/me/nucleos')
        .set('x-test-role', role)
        .expect(403);

      expect(nucleoService.findAssociados).not.toHaveBeenCalled();
    },
  );

  it('retorna 401 sem token autenticado', async () => {
    await request(app.getHttpServer()).get('/users/me/nucleos').expect(401);
    expect(nucleoService.findAssociados).not.toHaveBeenCalled();
  });
});

describe('Rotas de /users', () => {
  const USER_ID = '3f2b1c9e-8a47-4d21-9b6e-1a2c3d4e5f60';
  let app: INestApplication<App>;
  let userService: {
    countAtivos: jest.Mock;
    findById: jest.Mock;
    updatePermissions: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    userService = {
      countAtivos: jest.fn().mockResolvedValue(7),
      findById: jest.fn().mockResolvedValue({ id: USER_ID }),
      updatePermissions: jest.fn().mockResolvedValue({ message: 'ok' }),
      remove: jest.fn().mockReturnValue('removido'),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: NucleoService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile();

    app = module.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /users/contagem não é capturada por :id e aceita qualquer perfil', async () => {
    await request(app.getHttpServer())
      .get('/users/contagem')
      .set('x-test-role', Role.EQUIPE_COMUNICACAO)
      .expect(200);

    expect(userService.countAtivos).toHaveBeenCalled();
    expect(userService.findById).not.toHaveBeenCalled();
  });

  it('GET /users/:id recusa identificador que não é UUID', async () => {
    await request(app.getHttpServer())
      .get('/users/nao-e-uuid')
      .set('x-test-role', Role.ADMINISTRADOR)
      .expect(400);

    expect(userService.findById).not.toHaveBeenCalled();
  });

  it('PATCH /users/:id/permissions repassa o autor autenticado', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${USER_ID}/permissions`)
      .set('x-test-role', Role.ADMINISTRADOR)
      .send({ role: Role.ADMINISTRADOR })
      .expect(200);

    expect(userService.updatePermissions).toHaveBeenCalledWith(
      USER_ID,
      { role: Role.ADMINISTRADOR },
      expect.objectContaining({ id: 'usuario-autenticado' }),
    );
  });

  it('DELETE /users/:id exige autenticação e perfil ADMINISTRADOR', async () => {
    await request(app.getHttpServer()).delete(`/users/${USER_ID}`).expect(401);
    await request(app.getHttpServer())
      .delete(`/users/${USER_ID}`)
      .set('x-test-role', Role.EQUIPE_GESTAO)
      .expect(403);

    expect(userService.remove).not.toHaveBeenCalled();
  });
});
