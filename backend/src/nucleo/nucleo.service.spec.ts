import { ConflictException, NotFoundException } from '@nestjs/common';
import { AcaoAuditoria, Prisma, StatusRegistro } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NucleoRepository } from './nucleo.repository';
import { NucleoService } from './nucleo.service';

describe('NucleoService', () => {
  let service: NucleoService;
  let repository: {
    findConflito: jest.Mock;
    create: jest.Mock;
    findAtivoComVinculos: jest.Mock;
    softDelete: jest.Mock;
  };
  let audit: { registrarAcao: jest.Mock };
  const autor = { id: 'admin-uuid', ip: '203.0.113.7' };
  const dto = {
    nome: 'Núcleo de Educação Ambiental',
    sigla: 'NEA',
    corHex: '#2E7D32',
  };
  const createdAt = new Date('2026-10-25T15:00:00.000Z');

  beforeEach(() => {
    repository = {
      findConflito: jest.fn(),
      create: jest.fn(),
      findAtivoComVinculos: jest.fn(),
      softDelete: jest.fn(),
    };
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

  describe('remove', () => {
    const nucleo = {
      id: 'nucleo-uuid',
      nome: 'Núcleo de Educação Ambiental',
      sigla: 'NEA',
      descricao: null,
      corHex: '#2E7D32',
      imagemUrl: null,
      status: StatusRegistro.ATIVO,
      createdAt,
    };
    const semVinculos = { users: 0, programas: 0, indicadores: 0 };

    beforeEach(() => {
      repository.findAtivoComVinculos.mockResolvedValue({
        ...nucleo,
        _count: semVinculos,
      });
      repository.softDelete.mockResolvedValue(true);
    });

    it('exclui logicamente o núcleo elegível', async () => {
      await expect(
        service.remove('nucleo-uuid', autor),
      ).resolves.toBeUndefined();

      expect(repository.softDelete).toHaveBeenCalledWith('nucleo-uuid');
    });

    it('registra a exclusão na auditoria com autor e dados antigos', async () => {
      await service.remove('nucleo-uuid', autor);

      expect(audit.registrarAcao).toHaveBeenCalledWith({
        userId: 'admin-uuid',
        acao: AcaoAuditoria.EXCLUIR_LOGICO,
        entidade: 'Nucleo',
        entidadeId: 'nucleo-uuid',
        dadosAntigos: { ...nucleo, createdAt: createdAt.toISOString() },
        ip: '203.0.113.7',
      });
    });

    it('núcleo inexistente ou já excluído retorna 404 sem auditar', async () => {
      repository.findAtivoComVinculos.mockResolvedValue(null);

      await expect(service.remove('nucleo-uuid', autor)).rejects.toThrow(
        new NotFoundException('Núcleo não encontrado.'),
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it('núcleo excluído por requisição concorrente retorna 404 sem auditar', async () => {
      repository.softDelete.mockResolvedValue(false);

      await expect(service.remove('nucleo-uuid', autor)).rejects.toThrow(
        NotFoundException,
      );
      expect(audit.registrarAcao).not.toHaveBeenCalled();
    });

    it.each([
      [{ users: 2 }, 'usuários'],
      [{ programas: 1 }, 'programas'],
      [{ indicadores: 3 }, 'indicadores'],
    ])(
      'bloqueia com 409 quando há vínculos %o',
      async (vinculos, descricao) => {
        repository.findAtivoComVinculos.mockResolvedValue({
          ...nucleo,
          _count: { ...semVinculos, ...vinculos },
        });

        await expect(service.remove('nucleo-uuid', autor)).rejects.toThrow(
          new ConflictException(
            `O núcleo não pode ser excluído pois possui ${descricao} vinculados.`,
          ),
        );
        expect(repository.softDelete).not.toHaveBeenCalled();
        expect(audit.registrarAcao).not.toHaveBeenCalled();
      },
    );

    it('lista todos os vínculos impeditivos na mensagem', async () => {
      repository.findAtivoComVinculos.mockResolvedValue({
        ...nucleo,
        _count: { users: 1, programas: 1, indicadores: 1 },
      });

      await expect(service.remove('nucleo-uuid', autor)).rejects.toThrow(
        'O núcleo não pode ser excluído pois possui usuários, programas, indicadores vinculados.',
      );
    });
  });
});
