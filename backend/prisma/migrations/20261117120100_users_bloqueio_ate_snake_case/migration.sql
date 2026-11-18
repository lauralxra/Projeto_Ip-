-- Padroniza a coluna em snake_case, como o restante do schema (@map("bloqueio_ate"))
ALTER TABLE "users" RENAME COLUMN "bloqueioAte" TO "bloqueio_ate";
