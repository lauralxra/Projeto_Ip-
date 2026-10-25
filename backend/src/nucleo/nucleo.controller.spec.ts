import {
  CanActivate,
  ExecutionContext,
  INestApplication,
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

// Simula o JwtAuthGuard: o perfil do usuário vem do header x-test-role
class FakeJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.user = { id: 'autor-uuid', role: req.headers['x-test-role'] as Role };
    return true;
  }
}

describe('NucleoController (HTTP)', () => {
  let app: INestApplication<App>;
  let nucleoService: { create: jest.Mock };
  const payload = { nome: 'Núcleo de Educação Ambiental', sigla: 'nea' };

  beforeEach(async () => {
    nucleoService = {
      create: jest.fn().mockResolvedValue({ id: 'nucleo-uuid' }),
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
});
