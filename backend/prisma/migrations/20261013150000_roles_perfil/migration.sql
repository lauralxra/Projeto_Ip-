-- Renomeia o enum de perfil de acesso para Roles (novos valores).
-- Os valores antigos são convertidos para os novos antes da troca de tipo,
-- para não falhar nem perder dados em linhas já existentes.

BEGIN;

CREATE TYPE "perfil_acesso_new" AS ENUM ('ADMINISTRADOR', 'DIRETORES_NUCLEOS', 'EQUIPE_GESTAO', 'EQUIPE_COMUNICACAO');

ALTER TABLE "users" ALTER COLUMN "perfil" TYPE "perfil_acesso_new" USING (
  CASE "perfil"::text
    WHEN 'ADM' THEN 'ADMINISTRADOR'
    WHEN 'DN'  THEN 'DIRETORES_NUCLEOS'
    WHEN 'EG'  THEN 'EQUIPE_GESTAO'
    WHEN 'EC'  THEN 'EQUIPE_COMUNICACAO'
    ELSE "perfil"::text
  END
)::"perfil_acesso_new";

ALTER TABLE "faq_items" ALTER COLUMN "perfil_alvo" TYPE "perfil_acesso_new" USING (
  CASE "perfil_alvo"::text
    WHEN 'ADM' THEN 'ADMINISTRADOR'
    WHEN 'DN'  THEN 'DIRETORES_NUCLEOS'
    WHEN 'EG'  THEN 'EQUIPE_GESTAO'
    WHEN 'EC'  THEN 'EQUIPE_COMUNICACAO'
    ELSE "perfil_alvo"::text
  END
)::"perfil_acesso_new";

ALTER TYPE "perfil_acesso" RENAME TO "perfil_acesso_old";
ALTER TYPE "perfil_acesso_new" RENAME TO "perfil_acesso";
DROP TYPE "perfil_acesso_old";

COMMIT;
