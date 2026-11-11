import { Test, TestingModule } from '@nestjs/testing';
import { AcaoAuditoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: {
    loginLog: { create: jest.Mock };
    auditLog: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      loginLog: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('grava tentativa de login com IP e user-agent', async () => {
    await service.registrarTentativaLogin({
      email: 'maria@exemplo.com',
      sucesso: false,
      ip: '203.0.113.7',
      userAgent: 'jest',
    });

    expect(prisma.loginLog.create).toHaveBeenCalledWith({
      data: {
        emailTentado: 'maria@exemplo.com',
        sucesso: false,
        userId: null,
        ipOrigem: '203.0.113.7',
        userAgent: 'jest',
      },
    });
  });

  it('grava ação de auditoria com autor, entidade e dados novos', async () => {
    await service.registrarAcao({
      userId: 'admin-uuid',
      acao: AcaoAuditoria.CRIAR,
      entidade: 'User',
      entidadeId: 'novo-uuid',
      dadosNovos: { email: 'maria@exemplo.com' },
      ip: '203.0.113.7',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'admin-uuid',
        acao: AcaoAuditoria.CRIAR,
        entidade: 'User',
        entidadeId: 'novo-uuid',
        dadosAntigos: undefined,
        dadosNovos: { email: 'maria@exemplo.com' },
        ipOrigem: '203.0.113.7',
      },
    });
  });
});
