import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { NucleoService } from '../nucleo/nucleo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interface/request.interface';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    create: jest.Mock;
    atualizarDados: jest.Mock;
    updateStatus: jest.Mock;
    updateEmail: jest.Mock;
  };
  let nucleoService: { findAssociados: jest.Mock };

  beforeEach(async () => {
    userService = {
      create: jest.fn().mockResolvedValue({ id: 'novo-uuid' }),
      atualizarDados: jest.fn().mockResolvedValue({ id: 'usuario-uuid' }),
      updateStatus: jest
        .fn()
        .mockResolvedValue({ id: 'usuario-uuid', ativo: true }),
      updateEmail: jest
        .fn()
        .mockResolvedValue({ id: 'usuario-uuid', email: 'novo@exemplo.com' }),
    };
    nucleoService = { findAssociados: jest.fn().mockResolvedValue([]) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: NucleoService, useValue: nucleoService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
  });

  it('repassa o administrador autenticado e o IP como autor da criação', async () => {
    const dto = {
      name: 'Maria',
      email: 'maria@exemplo.com',
      password: 'Senha1234',
      confirmPassword: 'Senha1234',
      role: Role.EQUIPE_GESTAO,
    };
    const req = {
      user: { id: 'admin-uuid', role: Role.ADMINISTRADOR },
    } as AuthenticatedRequest;

    await controller.create(dto, req, '203.0.113.7');

    expect(userService.create).toHaveBeenCalledWith(dto, {
      id: 'admin-uuid',
      ip: '203.0.113.7',
    });
  });

  it('repassa nome, e-mail e o autor autenticado na atualização', async () => {
    const req = {
      user: { id: 'usuario-uuid', role: Role.EQUIPE_GESTAO },
    } as AuthenticatedRequest;

    await controller.update(
      'usuario-uuid',
      { name: 'Maria Silva', email: 'maria@exemplo.com' },
      req,
      '203.0.113.7',
    );

    expect(userService.atualizarDados).toHaveBeenCalledWith(
      'usuario-uuid',
      { name: 'Maria Silva', email: 'maria@exemplo.com' },
      { id: 'usuario-uuid', ip: '203.0.113.7' },
    );
  });

  it('busca os núcleos pelo ID do usuário autenticado', async () => {
    const req = {
      user: { id: 'diretor-uuid', role: Role.DIRETORES_NUCLEOS },
    } as AuthenticatedRequest;

    await controller.findMyNucleos(req);

    expect(nucleoService.findAssociados).toHaveBeenCalledWith('diretor-uuid');
  });

  it('repassa o status e o autor na rota updateStatus', async () => {
    const req = {
      user: { id: 'admin-uuid', role: Role.ADMINISTRADOR },
    } as AuthenticatedRequest;

    await controller.updateStatus(
      'usuario-uuid',
      { ativo: true },
      req,
      '203.0.113.7',
    );

    expect(userService.updateStatus).toHaveBeenCalledWith(
      'usuario-uuid',
      true,
      { id: 'admin-uuid', ip: '203.0.113.7' },
    );
  });

  it('repassa o email e o autor na rota updateEmail', async () => {
    const req = {
      user: { id: 'admin-uuid', role: Role.ADMINISTRADOR },
    } as AuthenticatedRequest;

    await controller.updateEmail(
      'usuario-uuid',
      { email: 'novo@exemplo.com' },
      req,
      '203.0.113.7',
    );

    expect(userService.updateEmail).toHaveBeenCalledWith(
      'usuario-uuid',
      'novo@exemplo.com',
      { id: 'admin-uuid', ip: '203.0.113.7' },
    );
  });
});
