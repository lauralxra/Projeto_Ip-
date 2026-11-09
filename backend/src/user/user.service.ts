import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
import { unlink } from 'fs';
import { join } from 'path';

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

  countAtivos() {
    return this.userRepository.countAtivos();
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
      if (usuarioAtual.fotoUrl) {
        const oldPath = join(process.cwd(), usuarioAtual.fotoUrl);
        unlink(oldPath, (err) => {
          if (err)
            console.warn(
              `[FOTO] Não foi possível remover foto antiga: ${err.message}`,
            );
        });
      }

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

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
