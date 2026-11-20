import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcaoAuditoria, Prisma, Role, StatusRegistro } from '@prisma/client';
import { CreateNucleoDto } from './dto/create-nucleo.dto';
import { SearchNucleoDto } from './dto/search-nucleo.dto';
import { UpdateNucleoDto } from './dto/update-nucleo.dto';
import { NucleoRepository } from './nucleo.repository';
import { AuditService } from '../audit/audit.service';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';
import { AuthenticatedUser } from '../auth/interface/request.interface';
import { removerUpload } from '../common/upload-imagem';

// Administrador e Equipe de Comunicação acessam todos os núcleos; os demais perfis
// (Diretor de Núcleo e Equipe de Gestão) só os núcleos aos quais estão vinculados (RF23)
const PERFIS_ACESSO_GLOBAL: Role[] = [
  Role.ADMINISTRADOR,
  Role.EQUIPE_COMUNICACAO,
];

function inicioDoDiaSeguinte(data: string) {
  const dia = new Date(data);
  dia.setUTCDate(dia.getUTCDate() + 1);
  return dia;
}

@Injectable()
export class NucleoService {
  constructor(
    private readonly nucleoRepository: NucleoRepository,
    private readonly audit: AuditService,
  ) {}

  async create(createNucleoDto: CreateNucleoDto, autor: AutorAcao) {
    const { nome, sigla } = createNucleoDto;

    const conflito = await this.nucleoRepository.findConflito(nome, sigla);
    if (conflito) {
      throw new ConflictException(
        conflito.nome.toLowerCase() === nome.toLowerCase()
          ? 'Já existe um núcleo cadastrado com este nome.'
          : 'Já existe um núcleo cadastrado com esta sigla.',
      );
    }

    // Violação de unicidade concorrente e falhas do banco ficam com o PrismaExceptionFilter (RNF16)
    const nucleo = await this.nucleoRepository.create(createNucleoDto);

    // RNF15: autor, recurso e alteração; data/hora fica em audit_logs.created_at
    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.CRIAR,
      entidade: 'Nucleo',
      entidadeId: nucleo.id,
      dadosNovos: { ...nucleo, createdAt: nucleo.createdAt.toISOString() },
      ip: autor.ip,
    });

    return nucleo;
  }

  async search(filtros: SearchNucleoDto, usuario: AuthenticatedUser) {
    const { termo, programaId, status, dataInicio, dataFim, ano, trimestre } =
      filtros;
    const { pagina, limite } = filtros;

    // Datas no formato AAAA-MM-DD podem ser comparadas como texto
    if (dataInicio && dataFim && dataInicio > dataFim) {
      throw new BadRequestException(
        'A data inicial deve ser anterior ou igual à data final.',
      );
    }

    // Núcleos excluídos logicamente (UC027) não aparecem nas consultas
    const where: Prisma.NucleoWhereInput = { deletedAt: null };

    // RN02: perfis sem acesso global só enxergam os núcleos aos quais estão vinculados
    if (!PERFIS_ACESSO_GLOBAL.includes(usuario.role)) {
      where.users = { some: { userId: usuario.id } };
    }

    if (termo) {
      where.OR = [
        { nome: { contains: termo, mode: 'insensitive' } },
        { sigla: { contains: termo, mode: 'insensitive' } },
        { descricao: { contains: termo, mode: 'insensitive' } },
      ];
    }

    if (programaId) {
      where.programas = { some: { id: programaId, deletedAt: null } };
    }

    if (status) {
      where.status = status;
    }

    if (dataInicio || dataFim) {
      where.createdAt = {
        ...(dataInicio && { gte: new Date(dataInicio) }),
        // Data final inclusiva: tudo antes do início do dia seguinte
        ...(dataFim && { lt: inicioDoDiaSeguinte(dataFim) }),
      };
    }

    if (ano) {
      where.indicadores = {
        some: {
          deletedAt: null,
          registros: {
            some: { deletedAt: null, ano, ...(trimestre && { trimestre }) },
          },
        },
      };
    }

    const [itens, total] = await this.nucleoRepository.search(
      where,
      (pagina - 1) * limite,
      limite,
    );

    return { itens, total, pagina, limite };
  }

  async findOne(id: string, usuario: AuthenticatedUser) {
    const nucleo = await this.nucleoRepository.findAtivoById(id);
    if (!nucleo) {
      throw new NotFoundException('Núcleo não encontrado.');
    }

    // RN01/RN02: sem acesso global, o usuário precisa estar vinculado ao núcleo
    if (
      !PERFIS_ACESSO_GLOBAL.includes(usuario.role) &&
      !(await this.nucleoRepository.usuarioVinculado(id, usuario.id))
    ) {
      throw new ForbiddenException('Você não possui acesso a este núcleo.');
    }

    // RN03: findAtivoById já seleciona apenas os campos previstos (nucleoSelect)
    return nucleo;
  }

  findAssociados(userId: string) {
    return this.nucleoRepository.findAssociadosByUserId(userId);
  }

  // A imagem já foi gravada em disco pelo interceptor; se o núcleo não existir,
  // o arquivo novo é descartado. A imagem anterior só é apagada após o update.
  async atualizarImagem(id: string, imagemUrl: string, autor: AutorAcao) {
    const nucleo = await this.nucleoRepository.findAtivoById(id);
    if (!nucleo || !(await this.nucleoRepository.updateImagem(id, imagemUrl))) {
      removerUpload(imagemUrl);
      throw new NotFoundException('Núcleo não encontrado.');
    }

    removerUpload(nucleo.imagemUrl);

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Nucleo',
      entidadeId: id,
      dadosAntigos: { imagemUrl: nucleo.imagemUrl },
      dadosNovos: { imagemUrl },
      ip: autor.ip,
    });

    return { message: 'Imagem do núcleo atualizada com sucesso.', imagemUrl };
  }

  async update(id: string, updateNucleoDto: UpdateNucleoDto, autor: AutorAcao) {
    const nucleo = await this.nucleoRepository.findAtivoById(id);
    if (!nucleo) {
      throw new NotFoundException('Núcleo não encontrado.');
    }

    if (updateNucleoDto.nome || updateNucleoDto.sigla) {
      const conflito = await this.nucleoRepository.findConflitoOutro(
        updateNucleoDto.nome,
        updateNucleoDto.sigla,
        id,
      );
      if (conflito) {
        throw new ConflictException(
          updateNucleoDto.nome &&
            conflito.nome.toLowerCase() === updateNucleoDto.nome.toLowerCase()
            ? 'Já existe um núcleo cadastrado com este nome.'
            : 'Já existe um núcleo cadastrado com esta sigla.',
        );
      }
    }

    const data: Prisma.NucleoUpdateInput = {};
    if (updateNucleoDto.nome !== undefined) data.nome = updateNucleoDto.nome;
    if (updateNucleoDto.sigla !== undefined) data.sigla = updateNucleoDto.sigla;
    if (updateNucleoDto.descricao !== undefined)
      data.descricao = updateNucleoDto.descricao;
    if (updateNucleoDto.corHex !== undefined)
      data.corHex = updateNucleoDto.corHex;
    if (updateNucleoDto.status !== undefined)
      data.status = updateNucleoDto.status;

    const atualizado = await this.nucleoRepository.update(id, data);

    const acaoAuditoria =
      updateNucleoDto.status === StatusRegistro.ATIVO &&
      nucleo.status !== StatusRegistro.ATIVO
        ? AcaoAuditoria.RESTAURAR
        : AcaoAuditoria.ATUALIZAR;

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: acaoAuditoria,
      entidade: 'Nucleo',
      entidadeId: id,
      dadosAntigos: { ...nucleo, createdAt: nucleo.createdAt.toISOString() },
      dadosNovos: {
        ...atualizado,
        createdAt: atualizado.createdAt.toISOString(),
      },
      ip: autor.ip,
    });

    return atualizado;
  }

  async remove(id: string, autor: AutorAcao) {
    const nucleo = await this.nucleoRepository.findAtivoComVinculos(id);
    if (!nucleo) {
      throw new NotFoundException('Núcleo não encontrado.');
    }

    const { _count: vinculos, ...dadosNucleo } = nucleo;
    const impeditivos = [
      vinculos.users > 0 && 'usuários',
      vinculos.programas > 0 && 'programas',
      vinculos.indicadores > 0 && 'indicadores',
    ].filter(Boolean);
    if (impeditivos.length > 0) {
      throw new ConflictException(
        `O núcleo não pode ser excluído pois possui ${impeditivos.join(', ')} vinculados.`,
      );
    }

    const excluido = await this.nucleoRepository.softDelete(id);
    if (!excluido) {
      throw new NotFoundException('Núcleo não encontrado.');
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.EXCLUIR_LOGICO,
      entidade: 'Nucleo',
      entidadeId: id,
      dadosAntigos: {
        ...dadosNucleo,
        createdAt: dadosNucleo.createdAt.toISOString(),
      },
      ip: autor.ip,
    });
  }

  async verificarPendencias(id: string) {
    const nucleo = await this.nucleoRepository.findAtivoById(id);
    if (!nucleo) {
      throw new NotFoundException('Núcleo não encontrado.');
    }

    return this.nucleoRepository.contarPendencias(id);
  }

  async deactivate(id: string, autor: AutorAcao) {
    const nucleo = await this.nucleoRepository.findAtivoById(id);
    if (!nucleo) {
      throw new NotFoundException('Núcleo não encontrado.');
    }

    if (nucleo.status !== StatusRegistro.ATIVO) {
      throw new ConflictException('O núcleo já está desativado ou arquivado.');
    }

    const desativado = await this.nucleoRepository.deactivate(id);
    if (!desativado) {
      throw new NotFoundException('Núcleo não encontrado ou já desativado.');
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.DESATIVAR,
      entidade: 'Nucleo',
      entidadeId: id,
      dadosAntigos: { ...nucleo, createdAt: nucleo.createdAt.toISOString() },
      dadosNovos: {
        ...nucleo,
        status: 'INATIVO',
        createdAt: nucleo.createdAt.toISOString(),
      },
      ip: autor.ip,
    });
  }

  async reactivate(id: string, autor: AutorAcao) {
    const nucleo = await this.nucleoRepository.findAtivoById(id);
    if (!nucleo) {
      throw new NotFoundException('Núcleo não encontrado.');
    }

    if (nucleo.status === StatusRegistro.ATIVO) {
      throw new ConflictException('O núcleo já está ativo.');
    }

    const reativado = await this.nucleoRepository.reactivate(id);
    if (!reativado) {
      throw new ConflictException(
        'O núcleo foi alterado por outra operação. Tente novamente.',
      );
    }

    await this.audit.registrarAcao({
      userId: autor.id,
      acao: AcaoAuditoria.RESTAURAR,
      entidade: 'Nucleo',
      entidadeId: id,
      dadosAntigos: { ...nucleo, createdAt: nucleo.createdAt.toISOString() },
      dadosNovos: {
        ...nucleo,
        status: StatusRegistro.ATIVO,
        createdAt: nucleo.createdAt.toISOString(),
      },
      ip: autor.ip,
    });

    return {
      message: 'Núcleo reativado com sucesso.',
      status: StatusRegistro.ATIVO,
    };
  }
}
