import { ConflictException } from '@nestjs/common';
import { AcaoAuditoria, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: { findActiveByEmail: jest.Mock; create: jest.Mock };
  let audit: { registrarAcao: jest.Mock };
  const autor = { id: 'admin-uuid', ip: '203.0.113.7' };
  const dto = {
    name: 'Maria',
    email: 'maria@exemplo.com',
    password: 'Senha1234',
    confirmPassword: 'Senha1234',
    role: Role.EQUIPE_GESTAO,
  };
  const createdAt = new Date('2026-10-25T12:00:00.000Z');

  beforeEach(() => {
    repository = { findActiveByEmail: jest.fn(), create: jest.fn() };
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    service = new UserService(
      {} as PrismaService,
      repository as unknown as UserRepository,
      audit as unknown as AuditService,
    );
  });

  describe('create', () => {
    beforeEach(() => {
      repository.findActiveByEmail.mockResolvedValue(null);
      repository.create.mockImplementation((data: Prisma.UserCreateInput) => ({
        id: 'novo-uuid',
        nome: data.nome,
        email: data.email,
        perfil: data.perfil,
        ativo: data.ativo,
        createdAt,
      }));
    });

    it('grava a senha somente como hash bcrypt e não devolve o hash', async () => {
      const result = await service.create(dto, autor);

      const [data] = repository.create.mock.calls[0] as [
        Prisma.UserCreateInput,
      ];
      expect(data.senhaHash).not.toBe(dto.password);
      expect(await bcrypt.compare(dto.password, data.senhaHash)).toBe(true);
      expect(data).not.toHaveProperty('password');
      expect(data).not.toHaveProperty('confirmPassword');
      expect(result).not.toHaveProperty('senhaHash');
    });

    it('cria o usuário ativo com o perfil informado', async () => {
      const result = await service.create(dto, autor);

      expect(result).toMatchObject({ perfil: Role.EQUIPE_GESTAO, ativo: true });
    });

    it('registra a criação na auditoria com o autor e os dados novos', async () => {
      await service.create(dto, autor);

      expect(audit.registrarAcao).toHaveBeenCalledWith({
        userId: 'admin-uuid',
        acao: AcaoAuditoria.CRIAR,
        entidade: 'User',
        entidadeId: 'novo-uuid',
        dadosNovos: {
          id: 'novo-uuid',
          nome: 'Maria',
          email: 'maria@exemplo.com',
          perfil: Role.EQUIPE_GESTAO,
          ativo: true,
          createdAt: createdAt.toISOString(),
        },
        ip: '203.0.113.7',
      });
    });

    it('recusa e-mail já cadastrado com 409 sem criar nem auditar', async () => {
      repository.findActiveByEmail.mockResolvedValue({ id: 'existente' });

      await expect(service.create(dto, autor)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('converte violação do índice único (cadastro concorrente) em 409', async () => {
      repository.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.create(dto, autor)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });
  });
});
