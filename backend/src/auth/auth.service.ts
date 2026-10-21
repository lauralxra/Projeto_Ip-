import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interface/jwt-payload.interface';
import { AuditService } from '../audit/audit.service';

export interface MetaRequisicao {
  ip: string;
  userAgent?: string;
}

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
    private readonly audit: AuditService,
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

  async login(loginDto: LoginDto, meta: MetaRequisicao) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (user?.bloqueioAte && user.bloqueioAte > new Date()) {
      throw new HttpException(
        'Esta conta está temporariamente bloqueada. Tente novamente mais tarde',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const senhaValida = await bcrypt.compare(
      password,
      user?.senhaHash ?? DUMMY_HASH,
    );

    // Todas as saídas passam por aqui, então sucesso e falha são auditados no mesmo ponto
    let falha: UnauthorizedException | ForbiddenException | null = null;

    if (!user || !senhaValida) {
      falha = new UnauthorizedException('Email ou senha inválidos.');
    } else if (!user.ativo || !user.perfil) {
      falha = new ForbiddenException(
        'Sua conta ainda não foi liberada pela administração.',
      );
    }

    await this.audit.registrarTentativaLogin({
      email,
      sucesso: !falha,
      userId: user?.id ?? null,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    if (user && !senhaValida) {
      await this.registrarTentativaInvalida(user.id, user.tentativas ?? 0);
    }

    if (falha) throw falha;

    // Non-null: a falha acima cobre user ausente e perfil nulo
    const usuario = user!;
    const perfil = usuario.perfil!;

    await this.prisma.user.update({
      where: { id: user?.id },
      data: {
        tentativas: 0,
        bloqueioAte: null,
        ultimoAcesso: new Date(),
      },
    });

    const payload: JwtPayload = { sub: usuario.id, role: perfil };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil,
        ativo: usuario.ativo,
        createdAt: usuario.createdAt,
      },
    };
  }

  async registrarTentativaInvalida(
    usuarioId: string,
    tentativasAtuais: number,
  ) {
    const PROXIMA_TENTATIVA = tentativasAtuais + 1;
    const MAX_TENTATIVAS = 5;

    if (PROXIMA_TENTATIVA >= MAX_TENTATIVAS) {
      // Calcula o tempo de bloqueio (ex: 15 minutos a partir de agora)
      const tempoBloqueio = new Date();
      tempoBloqueio.setMinutes(tempoBloqueio.getMinutes() + 15);

      // Incrementa e bloqueia a conta em uma única operação
      await this.prisma.user.update({
        where: { id: usuarioId },
        data: {
          tentativas: { increment: 1 },
          bloqueioAte: tempoBloqueio,
        },
      });

      throw new HttpException(
        'Muitas tentativas incorretas. Sua conta foi bloqueada por 15 minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Caso contrário, apenas incrementa o contador de erros
    await this.prisma.user.update({
      where: { id: usuarioId },
      data: {
        tentativas: { increment: 1 },
      },
    });

    throw new UnauthorizedException('Credenciais inválidas.');
  }
}
