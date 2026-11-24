import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AdminSeedService } from './admin-seed.service';

// Global: qualquer módulo pode injetar PrismaService sem reimportá-lo
@Global()
@Module({
  providers: [PrismaService, AdminSeedService],
  exports: [PrismaService, AdminSeedService],
})
export class PrismaModule {}
