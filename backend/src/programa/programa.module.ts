import { Module } from '@nestjs/common';
import { ProgramaService } from './programa.service';
import { ProgramaController } from './programa.controller';

@Module({
  controllers: [ProgramaController],
  providers: [ProgramaService],
})
export class ProgramaModule {}
