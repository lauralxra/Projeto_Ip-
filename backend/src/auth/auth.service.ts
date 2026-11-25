import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { AcaoAuditoria } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interface/jwt-payload.interface';
import { AuditService } from '../audit/audit.service';
import { BCRYPT_ROUNDS } from '../common/security.constants';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateCodeDto } from './dto/validate-code.dto';

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

// UC02 - recuperação de senha
const RECUPERACAO_VALIDADE_MINUTOS = 15;
const RECUPERACAO_MAX_TENTATIVAS = 5;
// Limite de códigos por conta: cada código novo traz 5 tentativas, então sem este
// limite bastaria pedir códigos em sequência para chutar todos os 1.000.000.
// Com ele: no máximo 3 códigos x 5 tentativas = 15 chutes por hora por conta.
const RECUPERACAO_INTERVALO_MINIMO_MS = 60 * 1000;
const RECUPERACAO_MAX_CODIGOS_POR_HORA = 3;
const RECUPERACAO_MENSAGEM =
  'Código de recuperação enviado para o e-mail informado.';
const EMAIL_NAO_CADASTRADO = 'E-mail não cadastrado.';
const AGUARDE_NOVO_CODIGO =
  'Um código foi enviado há menos de 1 minuto. Aguarde para solicitar outro.';
const LIMITE_CODIGOS_POR_HORA =
  'Limite de 3 códigos por hora atingido. Use o último código recebido ou tente novamente mais tarde.';
// Mesma resposta para e-mail inexistente, sem código, código errado ou expirado
const CODIGO_INVALIDO = 'Código inválido ou expirado.';

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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
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

  // UC02 passo 1 (e reenvio, RN07): gera um novo código e invalida os anteriores.
  // RN01/RN02 e FE01 (CT-002.02): apenas contas cadastradas e ativas podem solicitar recuperação;
  // e-mails não cadastrados recebem 404 explícito para impedir avanço indevido na tela.
  async solicitarRecuperacao(email: string) {
    const emailNormalizado = email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: { email: emailNormalizado, deletedAt: null, ativo: true },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(EMAIL_NAO_CADASTRADO);
    }

    // Acima do limite responde 429, sem gerar código nem enviar e-mail:
    // não serve para lotar a caixa de entrada de ninguém nem para chutar códigos
    await this.garantirLimiteDeCodigos(user.id);

    // Código de 6 dígitos com gerador criptográfico (zeros à esquerda são válidos)
    const codigo = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codigoHash = await bcrypt.hash(codigo, BCRYPT_ROUNDS);

    const expiraEm = new Date(
      Date.now() + RECUPERACAO_VALIDADE_MINUTOS * 60 * 1000,
    );

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usado: false },
        data: { usado: true },
      }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, codigoHash, expiraEm },
      }),
    ]);

    // Sem await: a resposta não fica presa à lentidão do SMTP.
    // Falha no envio fica só no log; o usuário pode pedir o reenvio.
    this.mail.sendPasswordReset(user.email, codigo).catch((error: unknown) => {
      this.logger.warn(
        `Código de recuperação gerado, mas o e-mail não foi enviado: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });

    return { message: RECUPERACAO_MENSAGEM };
  }

  // UC02 passo 2: confere o código sem consumi-lo
  async validarCodigoRecuperacao({ email, codigo }: ValidateCodeDto) {
    await this.verificarCodigo(email, codigo);
    return { valido: true };
  }

  // UC02 passo 3: troca a senha e consome o código na mesma transação (RN08)
  async redefinirSenha(dto: ResetPasswordDto, ip: string) {
    // RN05/RN06 (complexidade e confirmação) já foram validadas no DTO
    const { userId, tokenId } = await this.verificarCodigo(
      dto.email,
      dto.codigo,
    );

    const senhaHash = await bcrypt.hash(dto.novaSenha, BCRYPT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      // Consome o código condicionalmente: duas requisições simultâneas não usam o mesmo código
      const { count } = await tx.passwordResetToken.updateMany({
        where: { id: tokenId, usado: false, expiraEm: { gt: new Date() } },
        data: { usado: true },
      });
      if (count === 0) {
        throw new BadRequestException(CODIGO_INVALIDO);
      }

      // Quem provou ser dono do e-mail volta a conseguir entrar (zera o bloqueio
      // por senha errada) e todas as sessões abertas com a senha antiga caem
      const atualizado = await tx.user.update({
        where: { id: userId },
        data: {
          senhaHash,
          tentativas: 0,
          bloqueioAte: null,
          sessoesInvalidadasEm: new Date(),
        },
        select: { id: true, nome: true, email: true },
      });

      // Nunca grava senha nem hash na auditoria
      await this.audit.registrarAcao(
        {
          userId,
          acao: AcaoAuditoria.ATUALIZAR,
          entidade: 'User',
          entidadeId: userId,
          dadosNovos: { senha: 'redefinida', via: 'recuperacao_de_senha' },
          ip,
        },
        tx,
      );

      return atualizado;
    });

    // Aviso de segurança fora da transação: falha no e-mail não desfaz a troca de senha
    this.mail
      .sendPasswordChanged({ email: user.email, nome: user.nome })
      .catch((error: unknown) => {
        this.logger.warn(
          `Senha redefinida, mas o aviso por e-mail não foi enviado: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });

    return { message: 'Senha redefinida com sucesso.' };
  }

  private async garantirLimiteDeCodigos(userId: string): Promise<void> {
    const agora = Date.now();
    const recentes = await this.prisma.passwordResetToken.findMany({
      where: { userId, createdAt: { gte: new Date(agora - 60 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (recentes.length >= RECUPERACAO_MAX_CODIGOS_POR_HORA) {
      throw new HttpException(
        LIMITE_CODIGOS_POR_HORA,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (
      recentes.length > 0 &&
      agora - recentes[0].createdAt.getTime() < RECUPERACAO_INTERVALO_MINIMO_MS
    ) {
      throw new HttpException(
        AGUARDE_NOVO_CODIGO,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  // Confere o código do token mais recente não usado. A tentativa é reservada antes
  // da comparação (incremento condicional), para requisições paralelas não
  // ultrapassarem o limite de RECUPERACAO_MAX_TENTATIVAS. Acertos devolvem a tentativa.
  private async verificarCodigo(email: string, codigo: string) {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        usado: false,
        user: { email, deletedAt: null, ativo: true },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userId: true, codigoHash: true, expiraEm: true },
    });

    if (!token) {
      // Compara com um hash fictício para manter o tempo de resposta
      await bcrypt.compare(codigo, DUMMY_HASH);
      throw new BadRequestException(CODIGO_INVALIDO);
    }

    // RN04: código expirado
    if (token.expiraEm <= new Date()) {
      throw new BadRequestException(CODIGO_INVALIDO);
    }

    const { count } = await this.prisma.passwordResetToken.updateMany({
      where: { id: token.id, tentativas: { lt: RECUPERACAO_MAX_TENTATIVAS } },
      data: { tentativas: { increment: 1 } },
    });
    if (count === 0) {
      throw new HttpException(
        'Número máximo de tentativas excedido. Solicite um novo código.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const codigoValido = await bcrypt.compare(codigo, token.codigoHash);
    if (!codigoValido) {
      throw new BadRequestException(CODIGO_INVALIDO);
    }

    // Código certo devolve a tentativa reservada: só chutes errados gastam o
    // limite. Sem isso, validar e depois redefinir consumiria duas tentativas,
    // e quem acertou na 5ª receberia 429 ao redefinir.
    await this.prisma.passwordResetToken.updateMany({
      where: { id: token.id, tentativas: { gt: 0 } },
      data: { tentativas: { decrement: 1 } },
    });

    return { userId: token.userId, tokenId: token.id };
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
