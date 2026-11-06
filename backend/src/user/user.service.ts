import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcaoAuditoria, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepository } from './user.repository';
import { AuditService } from '../audit/audit.service';
import { BCRYPT_ROUNDS } from '../common/security.constants';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';

const EMAIL_EM_USO = 'Já existe um usuário cadastrado com este e-mail.';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly audit: AuditService,
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

  async findAll() {
    return this.prisma.user.findMany({
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { name, email, password, role, confirmPassword } = updateUserDto;

    if (password && password !== confirmPassword) {
      throw new ConflictException('As senhas não coincidem.');
    }

    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findActiveByEmail(email);

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(EMAIL_EM_USO);
      }
    }

    const data: Prisma.UserUpdateInput = {};

    if (name !== undefined) data.nome = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.perfil = role;

    if (password) {
      data.senhaHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
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
        },
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

    // 2. Valida se perfis que precisam de núcleo têm nucleoIds
    const perfisSemNucleo: Role[] = [
      Role.ADMINISTRADOR,
      Role.EQUIPE_COMUNICACAO,
    ];
    const precisaNucleo = dto.role && !perfisSemNucleo.includes(dto.role);

    if (precisaNucleo && (!dto.nucleoIds || dto.nucleoIds.length === 0)) {
      throw new ConflictException(
        'Usuários com perfil DN ou EG precisam ter ao menos um núcleo associado.',
      );
    }

    // 3. Atualiza o perfil
    if (dto.role) {
      await this.userRepository.updatePermissions(id, dto.role);
    }

    // 4. Sincroniza os núcleos
    if (dto.nucleoIds !== undefined) {
      await this.userRepository.syncNucleos(id, dto.nucleoIds);
    }

    // 5. Busca núcleos anteriores pra auditoria
    const nucleosAntigos = await this.userRepository.findNucleosByUserId(id);

    // 6. Registra auditoria
    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'User',
      entidadeId: id,
      dadosAntigos: {
        perfil: usuarioAtual.perfil,
        nucleos: nucleosAntigos.map((n) => n.nucleoId),
      },
      dadosNovos: {
        perfil: dto.role,
        nucleos: dto.nucleoIds,
      },
      ip: autor.ip,
    });

    return { message: 'Permissões atualizadas com sucesso.' };
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
