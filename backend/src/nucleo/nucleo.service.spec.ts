import { ConflictException } from '@nestjs/common';
import { AcaoAuditoria, Prisma, StatusRegistro } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NucleoRepository } from './nucleo.repository';
import { NucleoService } from './nucleo.service';

describe('NucleoService', () => {
  let service: NucleoService;
  let repository: { findConflito: jest.Mock; create: jest.Mock };
  let audit: { registrarAcao: jest.Mock };
  const autor = { id: 'admin-uuid', ip: '203.0.113.7' };
  const dto = {
    nome: 'Núcleo de Educação Ambiental',
    sigla: 'NEA',
    corHex: '#2E7D32',
  };
  const createdAt = new Date('2026-10-25T15:00:00.000Z');

  beforeEach(() => {
    repository = { findConflito: jest.fn(), create: jest.fn() };
    audit = { registrarAcao: jest.fn().mockResolvedValue({}) };
    service = new NucleoService(
      repository as unknown as NucleoRepository,
      audit as unknown as AuditService,
    );

    repository.findConflito.mockResolvedValue(null);
    repository.create.mockImplementation((data: Prisma.NucleoCreateInput) => ({
      id: 'nucleo-uuid',
      nome: data.nome,
      sigla: data.sigla,
      descricao: null,
      corHex: data.corHex,
      imagemUrl: null,
      status: StatusRegistro.ATIVO,
      createdAt,
    }));
  });

  it('persiste o núcleo e o devolve', async () => {
    const result = await service.create(dto, autor);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(result).toMatchObject({
      id: 'nucleo-uuid',
      sigla: 'NEA',
      status: StatusRegistro.ATIVO,
    });
  });

  it('registra a criação na auditoria com autor, recurso e dados novos', async () => {
    await service.create(dto, autor);

    expect(audit.registrarAcao).toHaveBeenCalledWith({
      userId: 'admin-uuid',
      acao: AcaoAuditoria.CRIAR,
      entidade: 'Nucleo',
      entidadeId: 'nucleo-uuid',
      dadosNovos: expect.objectContaining({
        nome: dto.nome,
        sigla: 'NEA',
        createdAt: createdAt.toISOString(),
      }) as unknown,
      ip: '203.0.113.7',
    });
  });

  it('recusa nome já cadastrado com 409 sem persistir nem auditar', async () => {
    repository.findConflito.mockResolvedValue({
      nome: 'núcleo de educação ambiental',
      sigla: 'OUTRA',
    });

    await expect(service.create(dto, autor)).rejects.toThrow(
      new ConflictException('Já existe um núcleo cadastrado com este nome.'),
    );
    expect(repository.create).not.toHaveBeenCalled();
    expect(audit.registrarAcao).not.toHaveBeenCalled();
  });

  it('recusa sigla já cadastrada com 409', async () => {
    repository.findConflito.mockResolvedValue({
      nome: 'Outro Núcleo',
      sigla: 'NEA',
    });

    await expect(service.create(dto, autor)).rejects.toThrow(
      new ConflictException('Já existe um núcleo cadastrado com esta sigla.'),
    );
  });

  it('não audita quando a gravação no banco falha', async () => {
    repository.create.mockRejectedValue(new Error('falha no banco'));

    await expect(service.create(dto, autor)).rejects.toThrow('falha no banco');
    expect(audit.registrarAcao).not.toHaveBeenCalled();
  });
});
