import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AcaoAuditoria, Prisma, Role, StatusRegistro } from '@prisma/client';
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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NotificacaoService } from '../notificacao/notificacao.service';

const EMAIL_EM_USO = 'Já existe um usuário cadastrado com este e-mail.';
const PERFIS_COM_NUCLEO: Role[] = [Role.DIRETORES_NUCLEOS, Role.EQUIPE_GESTAO];

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly audit: AuditService,
    private readonly notificacao: NotificacaoService,
  ) {}

  private async garantirNucleosAtivos(nucleoIds: string[]) {
    const unicos = [...new Set(nucleoIds)];
    if (unicos.length === 0) return;

    const encontrados = await this.prisma.nucleo.count({
      where: {
        id: { in: unicos },
        deletedAt: null,
        status: StatusRegistro.ATIVO,
      },
    });

    if (encontrados !== unicos.length) {
      throw new BadRequestException(
        'Um ou mais núcleos informados não existem ou estão inativos.',
      );
    }
  }

  async create(createUserDto: CreateUserDto, autor: AutorAcao) {
    const { name, email, password, role } = createUserDto;
    const nucleoIds = [...new Set(createUserDto.nucleoIds ?? [])];
    const exigeNucleo = PERFIS_COM_NUCLEO.includes(role);

    if (exigeNucleo && nucleoIds.length === 0) {
      throw new BadRequestException(
        'Usuários com perfil Diretor de Núcleo (DN) ou Equipe de Gestão (EG) precisam ter ao menos um núcleo associado.',
      );
    }

    if (!exigeNucleo && nucleoIds.length > 0) {
      throw new BadRequestException(
        'Perfis Administrador e Equipe de Comunicação não devem ter núcleos específicos vinculados.',
      );
    }

    if (await this.userRepository.findActiveByEmail(email)) {
      throw new ConflictException(EMAIL_EM_USO);
    }

    await this.garantirNucleosAtivos(nucleoIds);

    const senhaHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let user: Awaited<ReturnType<UserRepository['create']>>;
    try {
      user = await this.userRepository.create({
        nome: name,
        email,
        senhaHash,
        perfil: role,
        ativo: true,
        ...(nucleoIds.length > 0 && {
          nucleos: {
            create: nucleoIds.map((nucleoId) => ({ nucleoId })),
          },
        }),
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
      dadosNovos: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        ...(nucleoIds.length > 0 && { nucleos: nucleoIds }),
      },
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

  // Nome e e-mail de um usuário. A Administração edita qualquer usuário; no
  // próprio perfil, a troca de e-mail é conferida antes em atualizarPerfil
  async atualizarDados(
    id: string,
    dados: { name?: string; email?: string },
    autor: AutorAcao,
  ) {
    const atual = await this.userRepository.findActiveById(id);
    if (!atual) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const alteracoes: { nome?: string; email?: string } = {};
    if (dados.name !== undefined && dados.name !== atual.nome) {
      alteracoes.nome = dados.name;
    }
    if (dados.email !== undefined && dados.email !== atual.email) {
      alteracoes.email = dados.email;
    }
    if (Object.keys(alteracoes).length === 0) {
      throw new BadRequestException('Nenhuma alteração informada.');
    }

    if (alteracoes.email) {
      const existente = await this.userRepository.findActiveByEmail(
        alteracoes.email,
      );
      if (existente && existente.id !== id) {
        throw new ConflictException(EMAIL_EM_USO);
      }
    }

    try {
      const { count } = await this.userRepository.updateDados(id, alteracoes);
      if (count === 0) {
        throw new NotFoundException('Usuário não encontrado.');
      }
    } catch (error) {
      // Índice único de e-mail: outra requisição usou o mesmo e-mail no meio tempo
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
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'User',
      entidadeId: id,
      dadosAntigos: {
        ...(alteracoes.nome !== undefined && { nome: atual.nome }),
        ...(alteracoes.email !== undefined && { email: atual.email }),
      },
      dadosNovos: alteracoes,
      ip: autor.ip,
    });

    return this.userRepository.findActiveById(id);
  }

  // Edição do próprio perfil (qualquer perfil de acesso)
  async atualizarPerfil(id: string, dto: UpdateProfileDto, autor: AutorAcao) {
    if (dto.email !== undefined) {
      const usuario = await this.userRepository.findActiveWithPasswordById(id);
      if (!usuario) {
        throw new NotFoundException('Usuário não encontrado.');
      }
      if (
        dto.email !== usuario.email &&
        !(await bcrypt.compare(dto.currentPassword ?? '', usuario.senhaHash))
      ) {
        throw new UnauthorizedException('Senha atual incorreta.');
      }
    }

    return this.atualizarDados(id, { name: dto.name, email: dto.email }, autor);
  }

  // Libera ou bloqueia o acesso de um usuário (RF17/RF18)
  async alterarStatus(id: string, ativo: boolean, autor: AutorAcao) {
    if (autor.id === id) {
      throw new ForbiddenException(
        'Você não pode alterar o status da sua própria conta.',
      );
    }

    const atual = await this.userRepository.findActiveById(id);
    if (!atual) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (atual.ativo === ativo) {
      throw new ConflictException(
        ativo ? 'O usuário já está ativo.' : 'O usuário já está inativo.',
      );
    }
    // O login exige tipo de conta: sem ele, ativar não liberaria o acesso
    if (ativo && !atual.perfil) {
      throw new BadRequestException(
        'Defina o tipo de conta do usuário antes de ativá-lo.',
      );
    }

    const { count } = await this.userRepository.updateStatus(id, ativo);
    if (count === 0) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: ativo ? AcaoAuditoria.RESTAURAR : AcaoAuditoria.DESATIVAR,
      entidade: 'User',
      entidadeId: id,
      dadosAntigos: { ativo: atual.ativo },
      dadosNovos: { ativo },
      ip: autor.ip,
    });

    return {
      id,
      ativo,
      message: ativo
        ? 'Usuário ativado com sucesso.'
        : 'Usuário desativado com sucesso.',
    };
  }

  async updateStatus(id: string, ativo: boolean, autor: AutorAcao) {
    return this.alterarStatus(id, ativo, autor);
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

  // Redefinição de senha de outro usuário pela Administração. Para a própria
  // senha, o caminho é PATCH /users/profile/password, que confere a senha atual.
  async redefinirSenha(id: string, novaSenha: string, autor: AutorAcao) {
    if (autor.id === id) {
      throw new ForbiddenException(
        'Para trocar a sua própria senha, use a alteração de senha do perfil.',
      );
    }

    const usuario = await this.userRepository.findActiveWithPasswordById(id);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const senhaHash = await bcrypt.hash(novaSenha, BCRYPT_ROUNDS);
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
      dadosNovos: { senha: 'redefinida pela administração' },
      ip: autor.ip,
    });

    // Aviso de segurança ao dono da conta (não falha se o SMTP estiver fora)
    await this.notificacao.notificarSenhaAlterada({
      email: usuario.email,
      nome: usuario.nome,
    });

    return { message: 'Senha redefinida com sucesso.' };
  }
  async updatePermissions(
    id: string,
    dto: UpdateUserPermissionsDto,
    autor: AutorAcao,
  ) {
    // UC07/UC08: o administrador não pode alterar o próprio tipo de conta ou permissões
    if (autor.id === id) {
      throw new ForbiddenException(
        'Você não pode alterar o seu próprio tipo de conta ou permissões.',
      );
    }

    // 1. Busca o usuário
    const usuarioAtual = await this.userRepository.findActiveById(id);
    if (!usuarioAtual) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // 2. Lê os núcleos atuais antes de alterar, para validar e auditar
    const vinculosAtuais = await this.userRepository.findNucleosByUserId(id);
    const nucleosAntigos = vinculosAtuais.map((n) => n.nucleoId);
    const perfilFinal = dto.role ?? usuarioAtual.perfil;
    const precisaNucleo =
      perfilFinal !== null && PERFIS_COM_NUCLEO.includes(perfilFinal);

    let nucleosFinais: string[];
    let sincronizarNucleos = false;

    if (precisaNucleo) {
      nucleosFinais =
        dto.nucleoIds !== undefined
          ? [...new Set(dto.nucleoIds)]
          : nucleosAntigos;

      // 3. Valida o estado final: perfis DN e EG precisam de ao menos um núcleo ativo
      if (nucleosFinais.length === 0) {
        throw new ConflictException(
          'Usuários com perfil DN ou EG precisam ter ao menos um núcleo associado.',
        );
      }

      if (dto.nucleoIds !== undefined) {
        // Só os núcleos novos precisam estar ativos: manter um vínculo antigo
        // com núcleo que foi desativado depois não pode travar a edição
        await this.garantirNucleosAtivos(
          nucleosFinais.filter((n) => !nucleosAntigos.includes(n)),
        );
        sincronizarNucleos = true;
      }
    } else {
      // Perfis globais (ADM e EC) não devem receber vínculos de núcleos específicos
      if (dto.nucleoIds !== undefined && dto.nucleoIds.length > 0) {
        throw new BadRequestException(
          'Perfis Administrador e Equipe de Comunicação não devem ter núcleos específicos vinculados.',
        );
      }
      nucleosFinais = [];
      // Remove vínculos antigos caso o usuário tenha saído de DN/EG para ADM/EC
      sincronizarNucleos =
        nucleosAntigos.length > 0 || dto.nucleoIds !== undefined;
    }

    // 4 a 6 numa única transação: perfil, núcleos e auditoria são gravados
    // juntos ou nenhum deles é (ex.: perfil novo com núcleos antigos)
    await this.prisma.$transaction(async (tx) => {
      // 4. Atualiza o perfil
      if (dto.role) {
        const { count } = await this.userRepository.updatePermissions(
          id,
          dto.role,
          tx,
        );
        // Usuário excluído entre a leitura e a escrita
        if (count === 0) {
          throw new NotFoundException('Usuário não encontrado.');
        }
      }

      // 5. Sincroniza os núcleos
      if (sincronizarNucleos) {
        await this.userRepository.syncNucleos(id, nucleosFinais, tx);
      }

      // 6. Registra auditoria
      await this.audit.registrarAcao(
        {
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
        },
        tx,
      );
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

    const { count, nucleoIds, programasParticipante, programasResponsavel } =
      await this.userRepository.softDelete(id);
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
        programasParticipante,
        programasResponsavel,
      },
      dadosNovos: {
        ativo: false,
        excluido: true,
        nucleos: [],
        programasParticipante: [],
        programasResponsavel: [],
      },
      ip: autor.ip,
    });

    return { message: 'Usuário excluído com sucesso.' };
  }
}
