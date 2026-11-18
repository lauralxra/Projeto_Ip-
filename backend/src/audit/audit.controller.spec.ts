import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { FilterAuditDto } from './dto/filter-audit.dto';

describe('AuditController', () => {
  let controller: AuditController;
  let service: { findAll: jest.Mock };

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: service }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
  });

  it('deve chamar auditService.findAll com os filtros informados', async () => {
    const filtros: FilterAuditDto = { entidade: 'Indicador', limite: 20 };
    await controller.findAll(filtros);

    expect(service.findAll).toHaveBeenCalledWith(filtros);
  });
});
