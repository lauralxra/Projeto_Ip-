import { Module } from '@nestjs/common';
import { RegistroService } from './registro.service';
import { RegistroController } from './registro.controller';

@Module({
  controllers: [RegistroController],
  providers: [RegistroService],
})
export class RegistroModule {}
