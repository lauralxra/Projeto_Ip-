import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interface/jwt-payload.interface';

const BCRYPT_ROUNDS = 12;

// Hash fictício: mantém o tempo de resposta igual quando o e-mail não existe
const DUMMY_HASH = bcrypt.hashSync('senha-ficticia', BCRYPT_ROUNDS);

// Nunca expõe senhaHash
const publicUserSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    const userExists = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true },
    });

    if (userExists) {
      throw new ConflictException('Cadastro não pode ser concluído.');
    }

    const senhaHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Conta criada inativa e sem perfil até a administração liberar (RF17/RF18)
    const user = await this.prisma.user.create({
      data: { nome: name, email, senhaHash },
      select: publicUserSelect,
    });

    return {
      message:
        'Cadastro realizado. Aguarde a liberação de acesso pela administração.',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    const senhaValida = await bcrypt.compare(
      password,
      user?.senhaHash ?? DUMMY_HASH,
    );

    if (!user || !senhaValida) {
      throw new UnauthorizedException('Email ou senha inválidos.');
    }

    if (!user.ativo || !user.perfil) {
      throw new ForbiddenException(
        'Sua conta ainda não foi liberada pela administração.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { ultimoAcesso: new Date() },
    });

    const payload: JwtPayload = { sub: user.id, role: user.perfil };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
        ativo: user.ativo,
        createdAt: user.createdAt,
      },
    };
  }
}
