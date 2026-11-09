import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IndicadorController } from './indicador.controller';

@Module({
  imports: [AuthModule],
  controllers: [IndicadorController],
})
export class IndicadorModule {}
