import { Module } from '@nestjs/common';
import { IndicadorService } from './indicador.service';
import { IndicadorController } from './indicador.controller';

@Module({
  controllers: [IndicadorController],
  providers: [IndicadorService],
})
export class IndicadorModule {}
