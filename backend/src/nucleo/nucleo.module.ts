import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NucleoController } from './nucleo.controller';
import { NucleoService } from './nucleo.service';

@Module({
  imports: [AuthModule],
  controllers: [NucleoController],
  providers: [NucleoService],
})
export class NucleoModule {}