import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global: qualquer módulo pode injetar PrismaService sem reimportá-lo
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
