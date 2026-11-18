-- Programas: responsável (usuário), data de início e participantes.
-- Os três são opcionais, então programas já cadastrados continuam válidos.

-- AlterTable
ALTER TABLE "programas" ADD COLUMN     "data_inicio" DATE,
ADD COLUMN     "responsavel_id" UUID;

-- CreateTable
CREATE TABLE "programa_participantes" (
    "programa_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programa_participantes_pkey" PRIMARY KEY ("programa_id","user_id")
);

-- CreateIndex
CREATE INDEX "programa_participantes_user_id_idx" ON "programa_participantes"("user_id");

-- CreateIndex
CREATE INDEX "programas_responsavel_id_idx" ON "programas"("responsavel_id");

-- AddForeignKey
ALTER TABLE "programas" ADD CONSTRAINT "programas_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programa_participantes" ADD CONSTRAINT "programa_participantes_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "programas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programa_participantes" ADD CONSTRAINT "programa_participantes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
