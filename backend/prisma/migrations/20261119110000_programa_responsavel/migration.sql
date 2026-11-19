-- Adiciona coluna responsavel_id na tabela programas com chave estrangeira para users
ALTER TABLE "programas" ADD COLUMN "responsavel_id" UUID;

ALTER TABLE "programas" ADD CONSTRAINT "programas_responsavel_id_fkey"
  FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "programas_responsavel_id_idx" ON "programas"("responsavel_id");
