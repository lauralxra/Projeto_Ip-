import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  INestApplication,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { NucleoController } from './nucleo.controller';
import { NucleoService } from './nucleo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interface/request.interface';

// Simula o JwtAuthGuard: o perfil do usuário vem do header x-test-role; sem ele, 401
class FakeJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = req.headers['x-test-role'] as Role | undefined;
    if (!role) throw new UnauthorizedException();
    req.user = { id: 'autor-uuid', role };
    return true;
  }
}

describe('NucleoController (HTTP)', () => {
  let app: INestApplication<App>;
  let nucleoService: {
    create: jest.Mock;
    remove: jest.Mock;
    search: jest.Mock;
  };
  const payload = { nome: 'Núcleo de Educação Ambiental', sigla: 'nea' };

  beforeEach(async () => {
    nucleoService = {
      create: jest.fn().mockResolvedValue({ id: 'nucleo-uuid' }),
      remove: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue({ itens: [], total: 0 }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NucleoController],
      providers: [{ provide: NucleoService, useValue: nucleoService }],
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

  it('ADMINISTRADOR cadastra o núcleo e recebe 201', async () => {
    await request(app.getHttpServer())
      .post('/nucleos')
      .set('x-test-role', Role.ADMINISTRADOR)
      .send(payload)
      .expect(201)
      .expect({ id: 'nucleo-uuid' });

    expect(nucleoService.create).toHaveBeenCalledWith(
      { nome: 'Núcleo de Educação Ambiental', sigla: 'NEA' },
      expect.objectContaining({ id: 'autor-uuid' }),
    );
  });

  it.each([
    Role.DIRETORES_NUCLEOS,
    Role.EQUIPE_GESTAO,
    Role.EQUIPE_COMUNICACAO,
  ])('perfil %s recebe 403 e nada é cadastrado', async (role) => {
    await request(app.getHttpServer())
      .post('/nucleos')
      .set('x-test-role', role)
      .send(payload)
      .expect(403);

    expect(nucleoService.create).not.toHaveBeenCalled();
  });

  it('dados inválidos retornam 400', async () => {
    await request(app.getHttpServer())
      .post('/nucleos')
      .set('x-test-role', Role.ADMINISTRADOR)
      .send({ nome: '', sigla: 'NEA', corHex: 'verde' })
      .expect(400);

    expect(nucleoService.create).not.toHaveBeenCalled();
  });

  it('violação de unicidade no banco retorna 409 padronizado', async () => {
    nucleoService.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await request(app.getHttpServer())
      .post('/nucleos')
      .set('x-test-role', Role.ADMINISTRADOR)
      .send(payload)
      .expect(409)
      .expect({
        statusCode: 409,
        message: 'Já existe um registro cadastrado com estes dados.',
        error: 'Conflict',
      });
  });

  it('banco indisponível retorna 503 padronizado', async () => {
    nucleoService.create.mockRejectedValue(
      new Prisma.PrismaClientInitializationError(
        "Can't reach database server",
        'test',
      ),
    );

    await request(app.getHttpServer())
      .post('/nucleos')
      .set('x-test-role', Role.ADMINISTRADOR)
      .send(payload)
      .expect(503);
  });

  describe('DELETE /nucleos/:id', () => {
    const id = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

    it('ADMINISTRADOR exclui o núcleo e recebe 204', async () => {
      await request(app.getHttpServer())
        .delete(`/nucleos/${id}`)
        .set('x-test-role', Role.ADMINISTRADOR)
        .expect(204)
        .expect('');

      expect(nucleoService.remove).toHaveBeenCalledWith(
        id,
        expect.objectContaining({ id: 'autor-uuid' }),
      );
    });

    it.each([
      Role.DIRETORES_NUCLEOS,
      Role.EQUIPE_GESTAO,
      Role.EQUIPE_COMUNICACAO,
    ])('perfil %s recebe 403 e nada é excluído', async (role) => {
      await request(app.getHttpServer())
        .delete(`/nucleos/${id}`)
        .set('x-test-role', role)
        .expect(403);

      expect(nucleoService.remove).not.toHaveBeenCalled();
    });

    it('id que não é UUID retorna 400', async () => {
      await request(app.getHttpServer())
        .delete('/nucleos/123')
        .set('x-test-role', Role.ADMINISTRADOR)
        .expect(400);

      expect(nucleoService.remove).not.toHaveBeenCalled();
    });

    it('núcleo inexistente retorna 404', async () => {
      nucleoService.remove.mockRejectedValue(
        new NotFoundException('Núcleo não encontrado.'),
      );

      await request(app.getHttpServer())
        .delete(`/nucleos/${id}`)
        .set('x-test-role', Role.ADMINISTRADOR)
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Núcleo não encontrado.',
          error: 'Not Found',
        });
    });

    it('núcleo com vínculos retorna 409', async () => {
      nucleoService.remove.mockRejectedValue(
        new ConflictException(
          'O núcleo não pode ser excluído pois possui programas vinculados.',
        ),
      );

      await request(app.getHttpServer())
        .delete(`/nucleos/${id}`)
        .set('x-test-role', Role.ADMINISTRADOR)
        .expect(409);
    });
  });

  describe('GET /nucleos', () => {
    it('sem token retorna 401 e nada é consultado', async () => {
      await request(app.getHttpServer()).get('/nucleos').expect(401);

      expect(nucleoService.search).not.toHaveBeenCalled();
    });

    it.each([
      Role.ADMINISTRADOR,
      Role.DIRETORES_NUCLEOS,
      Role.EQUIPE_GESTAO,
      Role.EQUIPE_COMUNICACAO,
    ])('perfil %s pesquisa e recebe 200', async (role) => {
      await request(app.getHttpServer())
        .get('/nucleos')
        .set('x-test-role', role)
        .expect(200)
        .expect({ itens: [], total: 0 });

      expect(nucleoService.search).toHaveBeenCalledWith(
        expect.objectContaining({ pagina: 1, limite: 20 }),
        { id: 'autor-uuid', role },
      );
    });

    it('repassa os filtros convertidos ao service', async () => {
      await request(app.getHttpServer())
        .get('/nucleos')
        .query({ termo: ' nea ', ano: '2026', trimestre: 'Q1', limite: '5' })
        .set('x-test-role', Role.ADMINISTRADOR)
        .expect(200);

      expect(nucleoService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          termo: 'nea',
          ano: 2026,
          trimestre: 'Q1',
          pagina: 1,
          limite: 5,
        }),
        expect.anything(),
      );
    });

    it('filtros inválidos retornam 400', async () => {
      await request(app.getHttpServer())
        .get('/nucleos')
        .query({ status: 'EXCLUIDO', limite: '500' })
        .set('x-test-role', Role.ADMINISTRADOR)
        .expect(400);

      expect(nucleoService.search).not.toHaveBeenCalled();
    });

    it('parâmetros desconhecidos retornam 400', async () => {
      await request(app.getHttpServer())
        .get('/nucleos')
        .query({ cidade: 'Recife' })
        .set('x-test-role', Role.ADMINISTRADOR)
        .expect(400);
    });

    it('falha no banco retorna 500 padronizado', async () => {
      nucleoService.search.mockRejectedValue(
        new Prisma.PrismaClientUnknownRequestError('erro', {
          clientVersion: 'test',
        }),
      );

      await request(app.getHttpServer())
        .get('/nucleos')
        .set('x-test-role', Role.ADMINISTRADOR)
        .expect(500)
        .expect({
          statusCode: 500,
          message: 'Erro interno ao acessar o banco de dados.',
          error: 'Internal Server Error',
        });
    });
  });
});
