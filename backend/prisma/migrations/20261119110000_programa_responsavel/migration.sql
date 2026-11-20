-- Adiciona coluna responsavel_id na tabela programas com chave estrangeira para users.
-- Idempotente: bancos vindos da dev já podem ter a coluna, o índice e a FK criados
-- pela migration 20261119120000_programas_responsavel_participantes.
ALTER TABLE "programas" ADD COLUMN IF NOT EXISTS "responsavel_id" UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'programas_responsavel_id_fkey'
    ) THEN
        ALTER TABLE "programas" ADD CONSTRAINT "programas_responsavel_id_fkey"
          FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "programas_responsavel_id_idx" ON "programas"("responsavel_id");
