import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AcaoAuditoria, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepository } from './user.repository';
import { AuditService } from '../audit/audit.service';
import { BCRYPT_ROUNDS } from '../common/security.constants';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { removerUpload } from '../common/upload-imagem';
import { ChangePasswordDto } from './dto/change-password.dto';
import { NotificacaoService } from '../notificacao/notificacao.service';

const EMAIL_EM_USO = 'Já existe um usuário cadastrado com este e-mail.';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly audit: AuditService,
    private readonly notificacao: NotificacaoService,
  ) {}

  async create(createUserDto: CreateUserDto, autor: AutorAcao) {
    const { name, email, password, role } = createUserDto;

    if (await this.userRepository.findActiveByEmail(email)) {
      throw new ConflictException(EMAIL_EM_USO);
    }

    const senhaHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let user: Awaited<ReturnType<UserRepository['create']>>;
    try {
      user = await this.userRepository.create({
        nome: name,
        email,
        senhaHash,
        perfil: role,
        ativo: true,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(EMAIL_EM_USO);
      }
      throw error;
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.CRIAR,
      entidade: 'User',
      entidadeId: user.id,
      dadosNovos: { ...user, createdAt: user.createdAt.toISOString() },
      ip: autor.ip,
    });

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      ativo: user.ativo,
      createdAt: user.createdAt,
    };
  }

  countAtivos() {
    return this.userRepository.countAtivos();
  }

  async findAll() {
    // Usuários excluídos logicamente não aparecem na listagem
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        fotoUrl: true,
        perfil: true,
        ativo: true,
        ultimoAcesso: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        // A tela de usuários exibe e edita os núcleos de cada um
        nucleos: {
          where: { nucleo: { deletedAt: null } },
          select: {
            nucleo: { select: { id: true, nome: true, sigla: true } },
          },
        },
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      fotoUrl: user.fotoUrl,
      perfil: user.perfil,
      ativo: user.ativo,
      ultimoAcesso: user.ultimoAcesso,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  async updateName(id: string, name: string, autor: AutorAcao) {
    if (autor.id !== id) {
      throw new ForbiddenException(
        'Você só pode atualizar o seu próprio nome.',
      );
    }

    const usuarioAtual = await this.userRepository.findActiveById(id);
    if (!usuarioAtual) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const { count } = await this.userRepository.updateName(id, name);
    if (count === 0) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const usuarioAtualizado = await this.userRepository.findActiveById(id);
    if (!usuarioAtualizado) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'User',
      entidadeId: id,
      dadosAntigos: { nome: usuarioAtual.nome },
      dadosNovos: { nome: usuarioAtualizado.nome },
      ip: autor.ip,
    });

    return usuarioAtualizado;
  }

  async updateStatus(id: string, ativo: boolean, autor: AutorAcao) {
    if (autor.id === id && !ativo) {
      throw new ForbiddenException(
        'Você não pode inativar a sua própria conta.',
      );
    }

    const usuarioAtual = await this.userRepository.findActiveById(id);
    if (!usuarioAtual) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const { count } = await this.userRepository.updateStatus(id, ativo);
    if (count === 0) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'User',
      entidadeId: id,
      dadosAntigos: { ativo: usuarioAtual.ativo },
      dadosNovos: { ativo },
      ip: autor.ip,
    });

    return {
      id,
      ativo,
      message: `Status do usuário atualizado para ${ativo ? 'ativo' : 'inativo'}.`,
    };
  }

  async updateEmail(id: string, email: string, autor: AutorAcao) {
    const usuarioAtual = await this.userRepository.findActiveById(id);
    if (!usuarioAtual) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const emailNorm = email.trim().toLowerCase();
    const emUso = await this.prisma.user.findFirst({
      where: { email: emailNorm, id: { not: id }, deletedAt: null },
      select: { id: true },
    });
    if (emUso) {
      throw new ConflictException(EMAIL_EM_USO);
    }

    const { count } = await this.userRepository.updateEmail(id, emailNorm);
    if (count === 0) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'User',
      entidadeId: id,
      dadosAntigos: { email: usuarioAtual.email },
      dadosNovos: { email: emailNorm },
      ip: autor.ip,
    });

    return {
      id,
      email: emailNorm,
      message: 'E-mail do usuário atualizado com sucesso.',
    };
  }
  async updatePermissions(
    id: string,
    dto: UpdateUserPermissionsDto,
    autor: AutorAcao,
  ) {
    // 1. Busca o usuário
    const usuarioAtual = await this.userRepository.findActiveById(id);
    if (!usuarioAtual) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // 2. Lê os núcleos atuais antes de alterar, para validar e auditar
    const vinculosAtuais = await this.userRepository.findNucleosByUserId(id);
    const nucleosAntigos = vinculosAtuais.map((n) => n.nucleoId);
    const perfilFinal = dto.role ?? usuarioAtual.perfil;
    const nucleosFinais = dto.nucleoIds ?? nucleosAntigos;

    // 3. Valida o estado final: perfis DN e EG precisam de ao menos um núcleo
    const perfisSemNucleo: Role[] = [
      Role.ADMINISTRADOR,
      Role.EQUIPE_COMUNICACAO,
    ];
    const precisaNucleo =
      perfilFinal !== null && !perfisSemNucleo.includes(perfilFinal);

    if (precisaNucleo && nucleosFinais.length === 0) {
      throw new ConflictException(
        'Usuários com perfil DN ou EG precisam ter ao menos um núcleo associado.',
      );
    }

    // 4. Atualiza o perfil
    if (dto.role) {
      await this.userRepository.updatePermissions(id, dto.role);
    }

    // 5. Sincroniza os núcleos
    if (dto.nucleoIds !== undefined) {
      await this.userRepository.syncNucleos(id, dto.nucleoIds);
    }

    // 6. Registra auditoria
    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'User',
      entidadeId: id,
      dadosAntigos: {
        perfil: usuarioAtual.perfil,
        nucleos: nucleosAntigos,
      },
      dadosNovos: {
        perfil: perfilFinal,
        nucleos: nucleosFinais,
      },
      ip: autor.ip,
    });

    return { message: 'Permissões atualizadas com sucesso.' };
  }

  async updatePhoto(id: string, fotoUrl: string, autor: AutorAcao) {
    const usuarioAtual = await this.userRepository.findActiveById(id);
    if (!usuarioAtual) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    try {
      const { count } = await this.userRepository.updatePhoto(id, fotoUrl);
      if (count === 0) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      // Remove a foto antiga do disco
      removerUpload(usuarioAtual.fotoUrl);

      await this.audit.registrarAcao({
        userId: autor.id,
        acao: AcaoAuditoria.ATUALIZAR,
        entidade: 'User',
        entidadeId: id,
        dadosAntigos: { fotoUrl: usuarioAtual.fotoUrl ?? null },
        dadosNovos: { fotoUrl },
        ip: autor.ip,
      });

      return { message: 'Foto de perfil atualizada com sucesso.', fotoUrl };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Erro ao atualizar a foto de perfil.',
      );
    }
  }

  async changePassword(id: string, dto: ChangePasswordDto, autor: AutorAcao) {
    // A confirmação e as regras de complexidade (RN01) já foram validadas no DTO
    const user = await this.userRepository.findActiveWithPasswordById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const senhaAtualValida = await bcrypt.compare(
      dto.currentPassword,
      user.senhaHash,
    );
    if (!senhaAtualValida) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }

    // RN02: a nova senha não pode ser igual à atual
    const mesmaSenha = await bcrypt.compare(dto.newPassword, user.senhaHash);
    if (mesmaSenha) {
      throw new ConflictException(
        'A nova senha não pode ser idêntica à senha atual.',
      );
    }

    const senhaHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    const { count } = await this.userRepository.updatePassword(id, senhaHash);
    if (count === 0) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Nunca grava senha nem hash na auditoria
    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'User',
      entidadeId: id,
      dadosNovos: { senha: 'alterada' },
      ip: autor.ip,
    });

    await this.notificacao.notificarSenhaAlterada({
      email: user.email,
      nome: user.nome,
    });

    return { message: 'Senha alterada com sucesso.' };
  }

  async remove(id: string, autor: AutorAcao) {
    if (autor.id === id) {
      throw new ForbiddenException(
        'Você não pode excluir a sua própria conta.',
      );
    }

    const usuarioAtual = await this.userRepository.findActiveById(id);
    if (!usuarioAtual) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const { count, nucleoIds } = await this.userRepository.softDelete(id);
    if (count === 0) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.EXCLUIR_LOGICO,
      entidade: 'User',
      entidadeId: id,
      // Os vínculos com núcleos são removidos na exclusão e ficam registrados aqui
      dadosAntigos: {
        ativo: usuarioAtual.ativo,
        perfil: usuarioAtual.perfil,
        nucleos: nucleoIds,
      },
      dadosNovos: { ativo: false, excluido: true, nucleos: [] },
      ip: autor.ip,
    });

    return { message: 'Usuário excluído com sucesso.' };
  }
}
