import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };
  let jwt: { signAsync: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('token-fake') };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
  });

  describe('register', () => {
    const dto = {
      name: 'Maria',
      email: 'maria@exemplo.com',
      password: 'Senha@123',
    };

    it('cria usuário inativo com senha em bcrypt e sem devolver o hash', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => ({
        id: 'uuid',
        nome: data.nome,
        email: data.email,
        perfil: null,
        ativo: false,
      }));

      const result = await service.register(dto);

      const data = prisma.user.create.mock.calls[0][0].data;
      expect(data.senhaHash).not.toBe(dto.password);
      expect(await bcrypt.compare(dto.password, data.senhaHash)).toBe(true);
      expect(result.user).not.toHaveProperty('senhaHash');
      expect(result.user.ativo).toBe(false);
    });

    it('recusa e-mail já cadastrado', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existente' });
      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = { email: 'maria@exemplo.com', password: 'Senha@123' };
    let senhaHash: string;

    beforeAll(async () => {
      senhaHash = await bcrypt.hash(dto.password, 4);
    });

    it('retorna access token com sub e role, sem e-mail no payload', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'uuid',
        nome: 'Maria',
        email: dto.email,
        senhaHash,
        perfil: 'ADMINISTRADOR',
        ativo: true,
        createdAt: new Date(),
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.login(dto);

      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'uuid',
        role: 'ADMINISTRADOR',
      });
      expect(result.accessToken).toBe('token-fake');
      expect(result.user).not.toHaveProperty('senhaHash');
    });

    it('recusa senha errada com 401', async () => {
      prisma.user.findFirst.mockResolvedValue({
        senhaHash,
        ativo: true,
        perfil: 'EQUIPE_GESTAO',
      });
      await expect(
        service.login({ ...dto, password: 'errada123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('recusa e-mail inexistente com a mesma mensagem da senha errada', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('recusa conta ainda não liberada com 403, mesmo com senha correta', async () => {
      prisma.user.findFirst.mockResolvedValue({
        senhaHash,
        ativo: false,
        perfil: null,
      });
      await expect(service.login(dto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });
  });
});
