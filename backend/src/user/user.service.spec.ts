import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AcaoAuditoria, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: {
    findActiveByEmail: jest.Mock;
    create: jest.Mock;
    findActiveById: jest.Mock;
    updateName: jest.Mock;
  };
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
    repository = {
      findActiveByEmail: jest.fn(),
      create: jest.fn(),
      findActiveById: jest.fn(),
      updateName: jest.fn(),
    };
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

  describe('updateName', () => {
    const usuario = {
      id: 'usuario-uuid',
      nome: 'Maria da Silva',
      email: 'maria@exemplo.com',
      perfil: Role.EQUIPE_GESTAO,
      ativo: true,
      createdAt,
    };

    it('atualiza o nome do próprio usuário e registra a auditoria', async () => {
      repository.findActiveById
        .mockResolvedValueOnce(usuario)
        .mockResolvedValueOnce({ ...usuario, nome: 'Maria Silva' });
      repository.updateName.mockResolvedValue({ count: 1 });

      const result = await service.updateName(
        'usuario-uuid',
        'Maria Silva',
        { id: 'usuario-uuid', ip: '203.0.113.7' },
      );

      expect(repository.updateName).toHaveBeenCalledWith(
        'usuario-uuid',
        'Maria Silva',
      );
      expect(result).toMatchObject({ nome: 'Maria Silva' });
      expect(audit.registrarAcao).toHaveBeenCalledWith({
        userId: 'usuario-uuid',
        acao: AcaoAuditoria.ATUALIZAR,
        entidade: 'User',
        entidadeId: 'usuario-uuid',
        dadosAntigos: { nome: 'Maria da Silva' },
        dadosNovos: { nome: 'Maria Silva' },
        ip: '203.0.113.7',
      });
    });

    it('impede atualizar o nome de outro usuário', async () => {
      await expect(
        service.updateName('outro-uuid', 'Maria Silva', {
          id: 'usuario-uuid',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.findActiveById).not.toHaveBeenCalled();
      expect(repository.updateName).not.toHaveBeenCalled();
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('retorna 404 para usuário inexistente ou excluído', async () => {
      repository.findActiveById.mockResolvedValue(null);

      await expect(
        service.updateName('usuario-uuid', 'Maria Silva', {
          id: 'usuario-uuid',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.updateName).not.toHaveBeenCalled();
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('não audita quando o usuário deixa de estar ativo antes da atualização', async () => {
      repository.findActiveById.mockResolvedValue(usuario);
      repository.updateName.mockResolvedValue({ count: 0 });

      await expect(
        service.updateName('usuario-uuid', 'Maria Silva', {
          id: 'usuario-uuid',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });
  });
});
