import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../mail/mail.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LimiteRecuperacaoGuard } from './limite-recuperacao.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    AuditModule,
    MailModule,
    JwtModule.registerAsync({
      useFactory: (): JwtModuleOptions => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET precisa ter pelo menos 32 caracteres.');
        }
        return {
          secret,
          signOptions: {
            expiresIn: (process.env.JWT_EXPIRES_IN ?? '2h') as NonNullable<
              JwtSignOptions['expiresIn']
            >,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    // Uma instância só: as 4 rotas de recuperação dividem o mesmo limite por IP
    LimiteRecuperacaoGuard,
    // Guards globais: toda rota exige JWT (exceto @Public) e respeita @Roles
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  // UserModule usa o guard, que depende do JwtService
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
