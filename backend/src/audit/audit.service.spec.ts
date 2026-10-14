import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: { loginLog: { create: jest.Mock } };

  beforeEach(async () => {
    prisma = { loginLog: { create: jest.fn().mockResolvedValue({}) } };
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
});
