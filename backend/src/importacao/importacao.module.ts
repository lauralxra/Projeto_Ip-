import { Module } from '@nestjs/common';
import { ImportacaoService } from './importacao.service';
import { ImportacaoController } from './importacao.controller';

@Module({
  controllers: [ImportacaoController],
  providers: [ImportacaoService],
})
export class ImportacaoModule {}
