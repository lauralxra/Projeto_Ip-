import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // `prisma generate` não precisa de banco (ex.: no CI, sem .env);
    // comandos como `migrate` falham com erro explícito se a URL estiver vazia.
    url: process.env.DATABASE_URL ?? '',
  },
});
