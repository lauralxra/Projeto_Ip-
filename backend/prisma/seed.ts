import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString
  ? new PrismaPg({ connectionString })
  : undefined;
const prisma = new PrismaClient(adapter ? { adapter } : {});

const BCRYPT_ROUNDS = 12;

export async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@instituto-ipe.org.br')
    .toLowerCase()
    .trim();
  const adminName = process.env.ADMIN_NAME ?? 'Administrador do Sistema';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123456';

  console.log('[Seed] Iniciando processo de seeding no banco de dados...');

  const existingAdmin = await prisma.user.findFirst({
    where: { email: adminEmail, deletedAt: null },
  });

  const senhaHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

  if (existingAdmin) {
    console.log(
      `[Seed] Usuário administrador já existe (${adminEmail}). Atualizando papel e status...`,
    );
    const updated = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        perfil: Role.ADMINISTRADOR,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });
    console.log('[Seed] Administrador atualizado:', updated);
  } else {
    console.log(`[Seed] Criando novo usuário administrador: ${adminEmail}...`);
    const created = await prisma.user.create({
      data: {
        nome: adminName,
        email: adminEmail,
        senhaHash,
        perfil: Role.ADMINISTRADOR,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });
    console.log('[Seed] Administrador criado com sucesso:', created);
  }

  console.log('[Seed] Seeding concluído com sucesso.');
}

void main()
  .catch((error: unknown) => {
    console.error('[Seed] Falha ao executar seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
