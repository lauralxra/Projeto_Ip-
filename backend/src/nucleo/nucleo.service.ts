import { ConflictException, Injectable } from '@nestjs/common';
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
    return `This action returns all nucleo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nucleo`;
  }

  update(id: number, _updateNucleoDto: UpdateNucleoDto) {
    return `This action updates a #${id} nucleo`;
  }

  remove(id: number) {
    return `This action removes a #${id} nucleo`;
  }
}
