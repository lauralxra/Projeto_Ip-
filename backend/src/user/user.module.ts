import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NucleoModule } from '../nucleo/nucleo.module';

@Module({
  imports: [AuthModule, AuditModule, NucleoModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
