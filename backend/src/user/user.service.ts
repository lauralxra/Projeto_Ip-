import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcaoAuditoria, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
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

    return user;
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException('User not found');

    const { senhaHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
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
}
