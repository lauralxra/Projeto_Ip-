-- Metas: uma meta por indicador e período entre não excluídas.
-- Trimestre nulo é a meta anual. Como índice único não compara nulos, são dois
-- índices parciais: um para metas trimestrais e outro para a meta anual.
-- ATENÇÃO: se o banco já tiver metas duplicadas ativas, esta migration falha;
-- resolva os duplicados antes de rodar `prisma migrate deploy`.
CREATE UNIQUE INDEX "metas_indicador_trimestre_ativo_key"
  ON "metas" ("indicador_id", "ano", "trimestre")
  WHERE "deleted_at" IS NULL AND "trimestre" IS NOT NULL;

CREATE UNIQUE INDEX "metas_indicador_anual_ativo_key"
  ON "metas" ("indicador_id", "ano")
  WHERE "deleted_at" IS NULL AND "trimestre" IS NULL;
