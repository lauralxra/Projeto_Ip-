import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdmin();
  }

  async seedAdmin(): Promise<void> {
    const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@instituto-ipe.org.br')
      .toLowerCase()
      .trim();
    const adminName = process.env.ADMIN_NAME ?? 'Administrador do Sistema';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123456';

    try {
      const existingAdmin = await this.prisma.user.findFirst({
        where: { email: adminEmail, deletedAt: null },
      });

      if (existingAdmin) {
        if (
          existingAdmin.perfil !== Role.ADMINISTRADOR ||
          !existingAdmin.ativo
        ) {
          await this.prisma.user.update({
            where: { id: existingAdmin.id },
            data: {
              perfil: Role.ADMINISTRADOR,
              ativo: true,
            },
          });
          this.logger.log(
            `Usuário admin (${adminEmail}) sincronizado com papel ADMINISTRADOR e status ativo.`,
          );
        } else {
          this.logger.log(
            `Usuário admin (${adminEmail}) já configurado e ativo.`,
          );
        }
        return;
      }

      const senhaHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

      await this.prisma.user.create({
        data: {
          nome: adminName,
          email: adminEmail,
          senhaHash,
          perfil: Role.ADMINISTRADOR,
          ativo: true,
        },
      });

      this.logger.log(
        `Usuário administrador criado automaticamente com sucesso (${adminEmail}).`,
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Não foi possível executar o seeding automático na inicialização: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
