import {
  ConflictException,
  Injectable,
  NotFoundException,
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
      // Criado pela administração: já liberado com o perfil escolhido (RF17/RF18)
      user = await this.userRepository.create({
        nome: name,
        email,
        senhaHash,
        perfil: role,
        ativo: true,
      });
    } catch (error) {
      // Cadastro concorrente com o mesmo e-mail barrado pelo índice único parcial
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
  const users = await this.prisma.user.findMany({
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

  return users;
}



async findById(id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });

  if (!user) throw new NotFoundException('User not found');

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
  const user = await this.prisma.user.findUnique({
    where: { id },
  });

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
    const updatedUser = await this.prisma.user.update({
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

    return updatedUser;
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


  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
