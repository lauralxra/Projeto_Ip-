import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedRequest } from '../auth/interface/request.interface';
import { NotificacaoController } from './notificacao.controller';
import { NotificacaoService } from './notificacao.service';

class FakeJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = req.headers['x-test-role'] as Role | undefined;
    if (!role) throw new UnauthorizedException();
    req.user = { id: 'usuario-autenticado', role };
    return true;
  }
}

describe('NotificacaoController (UC014 — DELETE /notificacoes)', () => {
  const NOTIF_ID = '4fb25f32-ae95-4c23-9e73-60518293aeb4';
  let app: INestApplication<App>;
  let notificacaoService: {
    excluir: jest.Mock;
    excluirComoAdmin: jest.Mock;
  };

  beforeEach(async () => {
    notificacaoService = {
      excluir: jest
        .fn()
        .mockResolvedValue({ message: 'Notificação excluída com sucesso.' }),
      excluirComoAdmin: jest
        .fn()
        .mockResolvedValue({ message: 'Notificação excluída com sucesso.' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificacaoController],
      providers: [
        { provide: NotificacaoService, useValue: notificacaoService },
        Reflector,
        { provide: APP_GUARD, useClass: FakeJwtGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = module.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it.each([
    Role.ADMINISTRADOR,
    Role.DIRETORES_NUCLEOS,
    Role.EQUIPE_GESTAO,
    Role.EQUIPE_COMUNICACAO,
  ])(
    'DELETE /notificacoes/:id permite o perfil %s e repassa o usuário autenticado',
    async (role) => {
      await request(app.getHttpServer())
        .delete(`/notificacoes/${NOTIF_ID}`)
        .set('x-test-role', role)
        .expect(200)
        .expect({ message: 'Notificação excluída com sucesso.' });

      expect(notificacaoService.excluir).toHaveBeenCalledWith(
        NOTIF_ID,
        { id: 'usuario-autenticado', role },
        expect.any(String),
      );
    },
  );

  it('DELETE /notificacoes/:id recusa UUID inválido com 400 e sem token com 401', async () => {
    await request(app.getHttpServer())
      .delete(`/notificacoes/${NOTIF_ID}`)
      .expect(401);

    await request(app.getHttpServer())
      .delete('/notificacoes/nao-e-uuid')
      .set('x-test-role', Role.DIRETORES_NUCLEOS)
      .expect(400);

    expect(notificacaoService.excluir).not.toHaveBeenCalled();
  });

  it('DELETE /notificacoes/admin/:id permite ADMINISTRADOR e nega demais perfis com 403', async () => {
    await request(app.getHttpServer())
      .delete(`/notificacoes/admin/${NOTIF_ID}`)
      .set('x-test-role', Role.DIRETORES_NUCLEOS)
      .expect(403);

    expect(notificacaoService.excluirComoAdmin).not.toHaveBeenCalled();

    await request(app.getHttpServer())
      .delete(`/notificacoes/admin/${NOTIF_ID}`)
      .set('x-test-role', Role.ADMINISTRADOR)
      .expect(200)
      .expect({ message: 'Notificação excluída com sucesso.' });

    expect(notificacaoService.excluirComoAdmin).toHaveBeenCalledWith(
      NOTIF_ID,
      'usuario-autenticado',
      expect.any(String),
    );
  });
});
