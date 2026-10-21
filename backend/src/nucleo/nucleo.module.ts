import { Module } from '@nestjs/common';
import { NucleoService } from './nucleo.service';
import { NucleoController } from './nucleo.controller';

@Module({
  controllers: [NucleoController],
  providers: [NucleoService],
})
export class NucleoModule {}
