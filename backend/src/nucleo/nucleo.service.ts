import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcaoAuditoria } from '@prisma/client';
import { CreateNucleoDto } from './dto/create-nucleo.dto';
import { UpdateNucleoDto } from './dto/update-nucleo.dto';
import { NucleoRepository } from './nucleo.repository';
import { AuditService } from '../audit/audit.service';
import { AutorAcao } from '../common/interfaces/autor-acao.interface';

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

  findAll() {
    return this.nucleoRepository.findAllAtivos();
  }

  async findOne(id: string) {
    const nucleo = await this.nucleoRepository.findAtivoById(id);
    if (!nucleo) {
      throw new NotFoundException('Núcleo não encontrado.');
    }
    return nucleo;
  }

  update(id: number, _updateNucleoDto: UpdateNucleoDto) {
    return `This action updates a #${id} nucleo`;
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
}
