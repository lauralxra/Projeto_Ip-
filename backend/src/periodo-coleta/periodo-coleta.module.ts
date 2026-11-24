import { Module } from '@nestjs/common';
import { PeriodoColetaService } from './periodo-coleta.service';
import { PeriodoColetaController } from './periodo-coleta.controller';

@Module({
  controllers: [PeriodoColetaController],
  providers: [PeriodoColetaService],
})
export class PeriodoColetaModule {}
