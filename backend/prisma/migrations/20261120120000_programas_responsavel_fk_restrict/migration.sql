-- Alinha a FK programas.responsavel_id ao schema (onDelete: Restrict).
-- A migration 20261119110000 criou a constraint com ON DELETE SET NULL e a
-- 20261119120000 não a recriou porque o nome já existia.

ALTER TABLE "programas" DROP CONSTRAINT IF EXISTS "programas_responsavel_id_fkey";

ALTER TABLE "programas" ADD CONSTRAINT "programas_responsavel_id_fkey"
  FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
