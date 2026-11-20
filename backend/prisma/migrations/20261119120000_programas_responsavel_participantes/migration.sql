-- Programas: responsável (usuário), data de início e participantes.
-- Os três são opcionais, então programas já cadastrados continuam válidos.

-- AlterTable
ALTER TABLE "programas" ADD COLUMN IF NOT EXISTS "data_inicio" DATE;
ALTER TABLE "programas" ADD COLUMN IF NOT EXISTS "responsavel_id" UUID;

-- CreateTable
CREATE TABLE IF NOT EXISTS "programa_participantes" (
    "programa_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programa_participantes_pkey" PRIMARY KEY ("programa_id","user_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "programa_participantes_user_id_idx" ON "programa_participantes"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "programas_responsavel_id_idx" ON "programas"("responsavel_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'programas_responsavel_id_fkey'
    ) THEN
        ALTER TABLE "programas" ADD CONSTRAINT "programas_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'programa_participantes_programa_id_fkey'
    ) THEN
        ALTER TABLE "programa_participantes" ADD CONSTRAINT "programa_participantes_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "programas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'programa_participantes_user_id_fkey'
    ) THEN
        ALTER TABLE "programa_participantes" ADD CONSTRAINT "programa_participantes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
