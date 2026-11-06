import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AcaoAuditoria, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserRepository } from './user.repository';
import { AuditService } from '../audit/audit.service';
import { BCRYPT_ROUNDS } from '../common/security.constants';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';

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

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
  async requestEmailChange(
    id: string,
    dto: RequestEmailChangeDto,
    autor: AutorAcao,
  ) {
    if (dto.newEmail !== dto.confirmNewEmail) {
      throw new ConflictException('Os e-mails não coincidem.');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (dto.newEmail === user.email) {
      throw new ConflictException(
        'O novo e-mail não pode ser igual ao e-mail atual.',
      );
    }

    const senhaValida = await bcrypt.compare(
      dto.currentPassword,
      user.senhaHash,
    );
    if (!senhaValida) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }

    const emailEmUso = await this.userRepository.findActiveByEmail(
      dto.newEmail,
    );
    if (emailEmUso && emailEmUso.id !== id) {
      throw new ConflictException(
        'Este e-mail já está em uso por outra conta.',
      );
    }

    const token = crypto.randomUUID();
    const expiracao = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    await this.prisma.emailChangeToken.create({
      data: {
        userId: id,
        newEmail: dto.newEmail,
        token,
        expiresAt: expiracao,
      },
    });

    // Simulação de uma confirmação de email
    console.log(`[EMAIL SIMULADO] Enviar para: ${dto.newEmail}`);
    console.log(
      `[EMAIL SIMULADO] Link: http://localhost:5173/confirmar-email?token=${token}`,
    );

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'User',
      entidadeId: id,
      dadosAntigos: { email: user.email },
      dadosNovos: { email: dto.newEmail, status: 'pendente_confirmacao' },
      ip: autor.ip,
    });

    return {
      message:
        'Solicitação de troca de e-mail registrada. Verifique o novo e-mail para confirmar.',
    };
  }
  async confirmEmailChange(token: string) {
    const emailChangeToken = await this.prisma.emailChangeToken.findUnique({
      where: { token },
    });

    if (!emailChangeToken) {
      throw new NotFoundException('Token inválido.');
    }

    if (emailChangeToken.used) {
      throw new ConflictException('Este token já foi utilizado.');
    }

    if (new Date() > emailChangeToken.expiresAt) {
      throw new ConflictException(
        'Token expirado. Solicite uma nova troca de e-mail.',
      );
    }

    await this.prisma.user.update({
      where: { id: emailChangeToken.userId },
      data: { email: emailChangeToken.newEmail },
    });

    await this.prisma.emailChangeToken.update({
      where: { token },
      data: { used: true },
    });

    return { message: 'E-mail atualizado com sucesso.' };
  }
}
