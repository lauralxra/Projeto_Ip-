import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AcaoAuditoria, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { NotificacaoService } from '../notificacao/notificacao.service';

describe('UserService', () => {
  let service: UserService;
  let repository: {
    findActiveByEmail: jest.Mock;
    create: jest.Mock;
    findActiveById: jest.Mock;
    updateName: jest.Mock;
    updatePermissions: jest.Mock;
    syncNucleos: jest.Mock;
    findNucleosByUserId: jest.Mock;
    softDelete: jest.Mock;
    findActiveWithPasswordById: jest.Mock;
    updatePassword: jest.Mock;
  };
  let audit: { registrarAcao: jest.Mock };
  let notificacao: { notificarSenhaAlterada: jest.Mock };
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
      updatePermissions: jest.fn().mockResolvedValue({ count: 1 }),
      syncNucleos: jest.fn(),
      findNucleosByUserId: jest.fn().mockResolvedValue([]),
      softDelete: jest.fn().mockResolvedValue({ count: 1 }),
      findActiveWithPasswordById: jest.fn(),
      updatePassword: jest.fn().mockResolvedValue({ count: 1 }),
    };
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    notificacao = { notificarSenhaAlterada: jest.fn().mockResolvedValue(true) };
    service = new UserService(
      {} as PrismaService,
      repository as unknown as UserRepository,
      audit as unknown as AuditService,
      notificacao as unknown as NotificacaoService,
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

      const result = await service.updateName('usuario-uuid', 'Maria Silva', {
        id: 'usuario-uuid',
        ip: '203.0.113.7',
      });

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

  describe('updatePermissions', () => {
    const usuario = {
      id: 'usuario-uuid',
      nome: 'Maria',
      email: 'maria@exemplo.com',
      perfil: Role.DIRETORES_NUCLEOS as Role | null,
      ativo: true,
      createdAt,
    };

    beforeEach(() => {
      repository.findActiveById.mockResolvedValue(usuario);
    });

    it('audita os núcleos anteriores à sincronização, não os já alterados', async () => {
      let vinculos = [{ nucleoId: 'nucleo-antigo' }];
      repository.findNucleosByUserId.mockImplementation(() =>
        Promise.resolve(vinculos),
      );
      repository.syncNucleos.mockImplementation(
        (_id: string, nucleoIds: string[]) => {
          vinculos = nucleoIds.map((nucleoId) => ({ nucleoId }));
          return Promise.resolve([]);
        },
      );

      await service.updatePermissions(
        'usuario-uuid',
        { nucleoIds: ['nucleo-novo'] },
        autor,
      );

      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosAntigos: {
            perfil: Role.DIRETORES_NUCLEOS,
            nucleos: ['nucleo-antigo'],
          },
          dadosNovos: {
            perfil: Role.DIRETORES_NUCLEOS,
            nucleos: ['nucleo-novo'],
          },
        }),
      );
    });

    it('recusa remover todos os núcleos de um DN mesmo sem informar o perfil', async () => {
      repository.findNucleosByUserId.mockResolvedValue([
        { nucleoId: 'nucleo-antigo' },
      ]);

      await expect(
        service.updatePermissions('usuario-uuid', { nucleoIds: [] }, autor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.syncNucleos).not.toHaveBeenCalled();
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('recusa promover a EG usuário sem núcleo e sem informar nucleoIds', async () => {
      repository.findActiveById.mockResolvedValue({
        ...usuario,
        perfil: Role.EQUIPE_COMUNICACAO,
      });

      await expect(
        service.updatePermissions(
          'usuario-uuid',
          { role: Role.EQUIPE_GESTAO },
          autor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.updatePermissions).not.toHaveBeenCalled();
    });

    it('permite trocar para EG mantendo os núcleos já associados', async () => {
      repository.findNucleosByUserId.mockResolvedValue([
        { nucleoId: 'nucleo-antigo' },
      ]);

      await service.updatePermissions(
        'usuario-uuid',
        { role: Role.EQUIPE_GESTAO },
        autor,
      );

      expect(repository.updatePermissions).toHaveBeenCalledWith(
        'usuario-uuid',
        Role.EQUIPE_GESTAO,
      );
      expect(repository.syncNucleos).not.toHaveBeenCalled();
    });

    it('permite perfil ADMINISTRADOR sem núcleos', async () => {
      await service.updatePermissions(
        'usuario-uuid',
        { role: Role.ADMINISTRADOR },
        autor,
      );

      expect(repository.updatePermissions).toHaveBeenCalledWith(
        'usuario-uuid',
        Role.ADMINISTRADOR,
      );
    });

    it('retorna 404 para usuário inexistente ou excluído', async () => {
      repository.findActiveById.mockResolvedValue(null);

      await expect(
        service.updatePermissions(
          'usuario-uuid',
          { role: Role.ADMINISTRADOR },
          autor,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.updatePermissions).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('faz exclusão lógica e registra auditoria', async () => {
      repository.findActiveById.mockResolvedValue({
        id: 'user-uuid',
        ativo: true,
        perfil: Role.EQUIPE_GESTAO,
      });

      await expect(service.remove('user-uuid', autor)).resolves.toEqual({
        message: 'Usuário excluído com sucesso.',
      });
      expect(repository.softDelete).toHaveBeenCalledWith('user-uuid');
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.EXCLUIR_LOGICO,
          entidadeId: 'user-uuid',
          userId: autor.id,
        }),
      );
    });

    it('registra na auditoria os núcleos desvinculados na exclusão', async () => {
      repository.findActiveById.mockResolvedValue({
        id: 'user-uuid',
        ativo: true,
        perfil: Role.DIRETORES_NUCLEOS,
      });
      repository.softDelete.mockResolvedValue({
        count: 1,
        nucleoIds: ['nei', 'nuri'],
      });

      await service.remove('user-uuid', autor);

      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosAntigos: {
            ativo: true,
            perfil: Role.DIRETORES_NUCLEOS,
            nucleos: ['nei', 'nuri'],
          },
          dadosNovos: { ativo: false, excluido: true, nucleos: [] },
        }),
      );
    });

    it('impede o administrador de excluir a própria conta', async () => {
      await expect(service.remove(autor.id, autor)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('retorna 404 para usuário inexistente ou já excluído', async () => {
      repository.findActiveById.mockResolvedValue(null);

      await expect(service.remove('outro-uuid', autor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const senhaAtual = 'SenhaAtual123';
    const novaSenha = 'NovaSenhaForte2026';
    let senhaHashAtual: string;
    const dtoSenha = () => ({
      currentPassword: senhaAtual,
      newPassword: novaSenha,
      confirmNewPassword: novaSenha,
    });
    const usuario = 'user-uuid';
    const autorProprio = { id: usuario, ip: '203.0.113.7' };

    beforeAll(async () => {
      // Custo baixo só no teste, para não deixar a suíte lenta
      senhaHashAtual = await bcrypt.hash(senhaAtual, 4);
    });

    beforeEach(() => {
      repository.findActiveWithPasswordById.mockResolvedValue({
        id: usuario,
        nome: 'Maria',
        email: 'maria@exemplo.com',
        senhaHash: senhaHashAtual,
      });
    });

    it('salva a nova senha com hash bcrypt, audita e envia o aviso por e-mail', async () => {
      await expect(
        service.changePassword(usuario, dtoSenha(), autorProprio),
      ).resolves.toEqual({ message: 'Senha alterada com sucesso.' });

      const [, hashSalvo] = repository.updatePassword.mock.calls[0] as [
        string,
        string,
      ];
      expect(repository.updatePassword).toHaveBeenCalledWith(
        usuario,
        expect.any(String),
      );
      expect(hashSalvo).not.toBe(novaSenha);
      await expect(bcrypt.compare(novaSenha, hashSalvo)).resolves.toBe(true);

      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.ATUALIZAR,
          entidade: 'User',
          entidadeId: usuario,
          dadosNovos: { senha: 'alterada' },
        }),
      );
      const auditado = JSON.stringify(audit.registrarAcao.mock.calls[0]);
      expect(auditado).not.toContain(novaSenha);
      expect(auditado).not.toContain(hashSalvo);

      expect(notificacao.notificarSenhaAlterada).toHaveBeenCalledWith({
        email: 'maria@exemplo.com',
        nome: 'Maria',
      });
    });

    it('recusa senha atual incorreta com 401 sem alterar nada', async () => {
      await expect(
        service.changePassword(
          usuario,
          { ...dtoSenha(), currentPassword: 'Errada12345' },
          autorProprio,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(repository.updatePassword).not.toHaveBeenCalled();
      expect(audit.registrarAcao).not.toHaveBeenCalled();
      expect(notificacao.notificarSenhaAlterada).not.toHaveBeenCalled();
    });

    it('recusa nova senha idêntica à atual (RN02)', async () => {
      await expect(
        service.changePassword(
          usuario,
          {
            currentPassword: senhaAtual,
            newPassword: senhaAtual,
            confirmNewPassword: senhaAtual,
          },
          autorProprio,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.updatePassword).not.toHaveBeenCalled();
    });

    it('retorna 404 para usuário inexistente ou excluído', async () => {
      repository.findActiveWithPasswordById.mockResolvedValue(null);

      await expect(
        service.changePassword(usuario, dtoSenha(), autorProprio),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.updatePassword).not.toHaveBeenCalled();
    });

    it('conclui a troca mesmo se o aviso por e-mail falhar', async () => {
      notificacao.notificarSenhaAlterada.mockResolvedValue(false);

      await expect(
        service.changePassword(usuario, dtoSenha(), autorProprio),
      ).resolves.toEqual({ message: 'Senha alterada com sucesso.' });
      expect(repository.updatePassword).toHaveBeenCalled();
      expect(audit.registrarAcao).toHaveBeenCalled();
    });
  });
});
