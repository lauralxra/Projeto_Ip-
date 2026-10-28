import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interface/request.interface';

describe('UserController', () => {
  let controller: UserController;
  let userService: { create: jest.Mock; updateName: jest.Mock };

  beforeEach(async () => {
    userService = {
      create: jest.fn().mockResolvedValue({ id: 'novo-uuid' }),
      updateName: jest.fn().mockResolvedValue({ id: 'usuario-uuid' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
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

  it('repassa somente o nome e o autor autenticado na atualização', async () => {
    const req = {
      user: { id: 'usuario-uuid', role: Role.EQUIPE_GESTAO },
    } as AuthenticatedRequest;

    await controller.update(
      'usuario-uuid',
      { name: 'Maria Silva' },
      req,
      '203.0.113.7',
    );

    expect(userService.updateName).toHaveBeenCalledWith(
      'usuario-uuid',
      'Maria Silva',
      { id: 'usuario-uuid', ip: '203.0.113.7' },
    );
  });
});
