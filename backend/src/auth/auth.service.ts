import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AcaoAuditoria } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interface/jwt-payload.interface';
import { AuditService } from '../audit/audit.service';
import { BCRYPT_ROUNDS } from '../common/security.constants';

// Mesma mensagem para e-mail inexistente, senha errada e conta bloqueada:
// não revela quais e-mails existem nem confirma a senha durante o bloqueio
const CREDENCIAIS_INVALIDAS =
  'Email ou senha inválidos. Após 5 tentativas incorretas, o acesso fica bloqueado por 15 minutos.';

export interface MetaRequisicao {
  ip: string;
  userAgent?: string;
}

// Hash fictício: mantém o tempo de resposta igual quando o e-mail não existe
const DUMMY_HASH = bcrypt.hashSync('senha-ficticia', BCRYPT_ROUNDS);

// Nunca expõe senhaHash
const publicUserSelect = {
  id: true,
  nome: true,
  email: true,
  fotoUrl: true,
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

    const senhaValida = await bcrypt.compare(
      password,
      user?.senhaHash ?? DUMMY_HASH,
    );

    const contaBloqueada = !!user?.bloqueioAte && user.bloqueioAte > new Date();

    // Todas as saídas passam por aqui, então sucesso e falha são auditados no mesmo ponto.
    // Conta bloqueada responde igual a senha errada, mesmo com a senha certa,
    // para o bloqueio não virar um jeito de confirmar a senha por força bruta.
    let falha: UnauthorizedException | ForbiddenException | null = null;

    if (!user || !senhaValida || contaBloqueada) {
      falha = new UnauthorizedException(CREDENCIAIS_INVALIDAS);
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

    // Durante o bloqueio as tentativas não são contadas, para não estender o prazo
    if (user && !senhaValida && !contaBloqueada) {
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
        // Caminho da foto em /api/uploads (null sem foto), para a tela exibir após o login
        fotoUrl: usuario.fotoUrl ?? null,
      },
    };
  }

  async logout(userId: string, ip: string) {
    await this.audit.registrarAcao({
      userId,
      acao: AcaoAuditoria.ENCERRAR_SESSAO,
      entidade: 'Sessao',
      entidadeId: userId,
      dadosNovos: { evento: 'logout' },
      ip,
    });

    return { message: 'Sessão encerrada com sucesso' };
  }

  // Conta a tentativa errada e bloqueia a conta ao atingir o limite.
  // Não lança exceção: quem chama devolve a mesma resposta genérica de credenciais inválidas.
  async registrarTentativaInvalida(
    usuarioId: string,
    tentativasAtuais: number,
  ) {
    const PROXIMA_TENTATIVA = tentativasAtuais + 1;
    const MAX_TENTATIVAS = 5;

    if (PROXIMA_TENTATIVA >= MAX_TENTATIVAS) {
      // Bloqueia por 15 minutos e zera o contador para o próximo ciclo
      const tempoBloqueio = new Date();
      tempoBloqueio.setMinutes(tempoBloqueio.getMinutes() + 15);

      await this.prisma.user.update({
        where: { id: usuarioId },
        data: {
          tentativas: 0,
          bloqueioAte: tempoBloqueio,
        },
      });
      return;
    }

    await this.prisma.user.update({
      where: { id: usuarioId },
      data: {
        tentativas: { increment: 1 },
      },
    });
  }
}
