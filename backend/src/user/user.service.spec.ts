import {
  BadRequestException,
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
    updateDados: jest.Mock;
    updateStatus: jest.Mock;
    updateEmail: jest.Mock;
    updatePermissions: jest.Mock;
    syncNucleos: jest.Mock;
    findNucleosByUserId: jest.Mock;
    softDelete: jest.Mock;
    findActiveWithPasswordById: jest.Mock;
    updatePassword: jest.Mock;
  };
  let audit: { registrarAcao: jest.Mock };
  let prisma: {
    user: { findFirst: jest.Mock };
    nucleo: { count: jest.Mock };
  };
  let notificacao: { notificarSenhaAlterada: jest.Mock };
  const autor = { id: 'admin-uuid', ip: '203.0.113.7' };
  const NUCLEO_UUID = '1c8f2c0f-7b62-4f90-8b40-3d2e5f607b81';
  const dto = {
    name: 'Maria',
    email: 'maria@exemplo.com',
    password: 'Senha1234',
    confirmPassword: 'Senha1234',
    role: Role.EQUIPE_GESTAO,
    nucleoIds: [NUCLEO_UUID],
  };
  const createdAt = new Date('2026-10-25T12:00:00.000Z');

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      nucleo: {
        count: jest.fn((args: { where: { id: { in: string[] } } }) =>
          Promise.resolve(args.where.id.in.length),
        ),
      },
    };
    repository = {
      findActiveByEmail: jest.fn(),
      create: jest.fn(),
      findActiveById: jest.fn(),
      updateDados: jest.fn().mockResolvedValue({ count: 1 }),
      updateStatus: jest.fn().mockResolvedValue({ count: 1 }),
      updateEmail: jest.fn().mockResolvedValue({ count: 1 }),
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
      prisma as unknown as PrismaService,
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
          nucleos: [NUCLEO_UUID],
        },
        ip: '203.0.113.7',
      });
    });

    it.each([Role.DIRETORES_NUCLEOS, Role.EQUIPE_GESTAO])(
      'recusa criar conta %s sem núcleo obrigatório (UC012)',
      async (role) => {
        await expect(
          service.create({ ...dto, role, nucleoIds: [] }, autor),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repository.create).not.toHaveBeenCalled();
      },
    );

    it.each([Role.ADMINISTRADOR, Role.EQUIPE_COMUNICACAO])(
      'recusa vincular núcleos específicos ao criar perfil global %s (UC08/UC012)',
      async (role) => {
        await expect(
          service.create({ ...dto, role, nucleoIds: [NUCLEO_UUID] }, autor),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repository.create).not.toHaveBeenCalled();
      },
    );

    it('recusa criar conta vinculada a núcleo inexistente ou inativo', async () => {
      prisma.nucleo.count.mockResolvedValueOnce(0);

      await expect(service.create(dto, autor)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.create).not.toHaveBeenCalled();
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

  describe('atualizarDados (Administração)', () => {
    const usuario = {
      id: 'usuario-uuid',
      nome: 'Maria da Silva',
      email: 'maria@exemplo.com',
      perfil: Role.EQUIPE_GESTAO,
      ativo: true,
      createdAt,
    };

    it('altera nome e e-mail de outro usuário e audita só o que mudou', async () => {
      repository.findActiveById
        .mockResolvedValueOnce(usuario)
        .mockResolvedValueOnce({ ...usuario, nome: 'Maria Silva' });
      repository.findActiveByEmail.mockResolvedValue(null);

      await service.atualizarDados(
        'usuario-uuid',
        { name: 'Maria Silva', email: 'nova@exemplo.com' },
        autor,
      );

      expect(repository.updateDados).toHaveBeenCalledWith('usuario-uuid', {
        nome: 'Maria Silva',
        email: 'nova@exemplo.com',
      });
      expect(audit.registrarAcao).toHaveBeenCalledWith({
        userId: autor.id,
        acao: AcaoAuditoria.ATUALIZAR,
        entidade: 'User',
        entidadeId: 'usuario-uuid',
        dadosAntigos: { nome: 'Maria da Silva', email: 'maria@exemplo.com' },
        dadosNovos: { nome: 'Maria Silva', email: 'nova@exemplo.com' },
        ip: autor.ip,
      });
    });

    it('recusa e-mail já usado por outro usuário', async () => {
      repository.findActiveById.mockResolvedValue(usuario);
      repository.findActiveByEmail.mockResolvedValue({ id: 'outro-uuid' });

      await expect(
        service.atualizarDados(
          'usuario-uuid',
          { email: 'x@exemplo.com' },
          autor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.updateDados).not.toHaveBeenCalled();
    });

    it('recusa requisição sem alterações', async () => {
      repository.findActiveById.mockResolvedValue(usuario);

      await expect(
        service.atualizarDados('usuario-uuid', { name: usuario.nome }, autor),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('retorna 404 para usuário inexistente ou excluído', async () => {
      repository.findActiveById.mockResolvedValue(null);

      await expect(
        service.atualizarDados('usuario-uuid', { name: 'X' }, autor),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('não audita quando o usuário é excluído antes da atualização', async () => {
      repository.findActiveById.mockResolvedValue(usuario);
      repository.updateDados.mockResolvedValue({ count: 0 });

      await expect(
        service.atualizarDados('usuario-uuid', { name: 'Outro' }, autor),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });
  });

  describe('atualizarPerfil (próprio usuário)', () => {
    const usuario = {
      id: 'usuario-uuid',
      nome: 'Maria',
      email: 'maria@exemplo.com',
      perfil: Role.EQUIPE_GESTAO,
      ativo: true,
      createdAt,
    };

    it('troca o e-mail com a senha atual correta', async () => {
      repository.findActiveWithPasswordById.mockResolvedValue({
        ...usuario,
        senhaHash: await bcrypt.hash('SenhaAtual123', 4),
      });
      repository.findActiveById.mockResolvedValue(usuario);
      repository.findActiveByEmail.mockResolvedValue(null);

      await service.atualizarPerfil(
        'usuario-uuid',
        { email: 'nova@exemplo.com', currentPassword: 'SenhaAtual123' },
        { id: 'usuario-uuid' },
      );

      expect(repository.updateDados).toHaveBeenCalledWith('usuario-uuid', {
        email: 'nova@exemplo.com',
      });
    });

    it('recusa trocar o e-mail com a senha atual errada', async () => {
      repository.findActiveWithPasswordById.mockResolvedValue({
        ...usuario,
        senhaHash: await bcrypt.hash('SenhaAtual123', 4),
      });

      await expect(
        service.atualizarPerfil(
          'usuario-uuid',
          { email: 'nova@exemplo.com', currentPassword: 'errada' },
          { id: 'usuario-uuid' },
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(repository.updateDados).not.toHaveBeenCalled();
    });

    it('troca só o nome sem pedir senha', async () => {
      repository.findActiveById.mockResolvedValue(usuario);

      await service.atualizarPerfil(
        'usuario-uuid',
        { name: 'Maria Souza' },
        { id: 'usuario-uuid' },
      );

      expect(repository.findActiveWithPasswordById).not.toHaveBeenCalled();
      expect(repository.updateDados).toHaveBeenCalledWith('usuario-uuid', {
        nome: 'Maria Souza',
      });
    });
  });

  describe('updateEmail', () => {
    const usuario = {
      id: 'usuario-uuid',
      nome: 'Maria da Silva',
      email: 'maria@exemplo.com',
      perfil: Role.EQUIPE_GESTAO,
      ativo: true,
      createdAt,
    };

    it('atualiza o email do usuário e registra auditoria', async () => {
      repository.findActiveById.mockResolvedValue(usuario);
      repository.updateEmail.mockResolvedValue({ count: 1 });
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await service.updateEmail(
        'usuario-uuid',
        'novo@exemplo.com',
        autor,
      );

      expect(repository.updateEmail).toHaveBeenCalledWith(
        'usuario-uuid',
        'novo@exemplo.com',
      );
      expect(result).toMatchObject({
        id: 'usuario-uuid',
        email: 'novo@exemplo.com',
      });
      expect(audit.registrarAcao).toHaveBeenCalled();
    });

    it('retorna 409 se o email já estiver em uso por outro usuário', async () => {
      repository.findActiveById.mockResolvedValue(usuario);
      prisma.user.findFirst.mockResolvedValue({ id: 'outro-uuid' });

      await expect(
        service.updateEmail('usuario-uuid', 'em.uso@exemplo.com', autor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.updateEmail).not.toHaveBeenCalled();
    });
  });

  describe('alterarStatus', () => {
    const usuario = {
      id: 'usuario-uuid',
      nome: 'Maria',
      email: 'maria@exemplo.com',
      perfil: Role.EQUIPE_GESTAO as Role | null,
      ativo: false,
      createdAt,
    };

    it('ativa usuário com tipo de conta definido', async () => {
      repository.findActiveById.mockResolvedValue(usuario);

      await service.alterarStatus('usuario-uuid', true, autor);

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'usuario-uuid',
        true,
      );
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: AcaoAuditoria.RESTAURAR,
          dadosAntigos: { ativo: false },
          dadosNovos: { ativo: true },
        }),
      );
    });

    it('não ativa usuário sem tipo de conta (o login continuaria bloqueado)', async () => {
      repository.findActiveById.mockResolvedValue({ ...usuario, perfil: null });

      await expect(
        service.alterarStatus('usuario-uuid', true, autor),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('impede alterar o status da própria conta', async () => {
      await expect(
        service.alterarStatus(autor.id, false, autor),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('responde 409 quando o status já é o pedido', async () => {
      repository.findActiveById.mockResolvedValue(usuario);

      await expect(
        service.alterarStatus('usuario-uuid', false, autor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('redefinirSenha', () => {
    it('grava o hash da nova senha, audita sem a senha e avisa o usuário', async () => {
      repository.findActiveWithPasswordById.mockResolvedValue({
        id: 'usuario-uuid',
        nome: 'Maria',
        email: 'maria@exemplo.com',
        senhaHash: 'hash-antigo',
      });

      await service.redefinirSenha('usuario-uuid', 'NovaSenhaForte2026', autor);

      const [, hash] = repository.updatePassword.mock.calls[0] as [
        string,
        string,
      ];
      await expect(bcrypt.compare('NovaSenhaForte2026', hash)).resolves.toBe(
        true,
      );
      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosNovos: { senha: 'redefinida pela administração' },
        }),
      );
      expect(notificacao.notificarSenhaAlterada).toHaveBeenCalledWith({
        email: 'maria@exemplo.com',
        nome: 'Maria',
      });
    });

    it('não redefine a própria senha por esta rota', async () => {
      await expect(
        service.redefinirSenha(autor.id, 'NovaSenhaForte2026', autor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.updatePassword).not.toHaveBeenCalled();
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

    it('impede o administrador de alterar o próprio tipo de conta ou permissões (UC07/UC08)', async () => {
      await expect(
        service.updatePermissions(
          autor.id,
          { role: Role.EQUIPE_GESTAO, nucleoIds: [NUCLEO_UUID] },
          autor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.updatePermissions).not.toHaveBeenCalled();
      expect(repository.syncNucleos).not.toHaveBeenCalled();
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('recusa vincular núcleos específicos a perfil ADMINISTRADOR ou EQUIPE_COMUNICACAO', async () => {
      await expect(
        service.updatePermissions(
          'usuario-uuid',
          { role: Role.EQUIPE_COMUNICACAO, nucleoIds: [NUCLEO_UUID] },
          autor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.updatePermissions).not.toHaveBeenCalled();
      expect(repository.syncNucleos).not.toHaveBeenCalled();
    });

    it('limpa vínculos antigos de núcleos ao mudar DN/EG para perfil global', async () => {
      repository.findNucleosByUserId.mockResolvedValue([
        { nucleoId: 'nucleo-antigo' },
      ]);

      await service.updatePermissions(
        'usuario-uuid',
        { role: Role.ADMINISTRADOR },
        autor,
      );

      expect(repository.updatePermissions).toHaveBeenCalledWith(
        'usuario-uuid',
        Role.ADMINISTRADOR,
      );
      expect(repository.syncNucleos).toHaveBeenCalledWith('usuario-uuid', []);
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
        programasParticipante: ['prog-1'],
        programasResponsavel: ['prog-2'],
      });

      await service.remove('user-uuid', autor);

      expect(audit.registrarAcao).toHaveBeenCalledWith(
        expect.objectContaining({
          dadosAntigos: {
            ativo: true,
            perfil: Role.DIRETORES_NUCLEOS,
            nucleos: ['nei', 'nuri'],
            programasParticipante: ['prog-1'],
            programasResponsavel: ['prog-2'],
          },
          dadosNovos: {
            ativo: false,
            excluido: true,
            nucleos: [],
            programasParticipante: [],
            programasResponsavel: [],
          },
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
