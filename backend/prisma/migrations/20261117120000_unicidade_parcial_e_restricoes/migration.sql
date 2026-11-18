-- Regras que o schema.prisma não consegue expressar (antes citadas como "migration_extra.sql",
-- arquivo que nunca foi versionado). Unicidade vale só entre registros não excluídos (soft delete).
-- ATENÇÃO: se o banco já tiver duplicados entre registros ativos, esta migration falha;
-- resolva os duplicados antes de rodar `prisma migrate deploy`.

-- 1. Usuários: um e-mail ativo por vez (a aplicação já salva em minúsculas)
CREATE UNIQUE INDEX "users_email_ativo_key"
  ON "users" (lower("email"))
  WHERE "deleted_at" IS NULL;

-- 2. Núcleos: nome e sigla únicos entre não excluídos
CREATE UNIQUE INDEX "nucleos_nome_ativo_key"
  ON "nucleos" (lower("nome"))
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "nucleos_sigla_ativo_key"
  ON "nucleos" (lower("sigla"))
  WHERE "deleted_at" IS NULL;

-- 3. Programas: nome único por núcleo (nucleo_id nulo = programa institucional do IPÊ)
CREATE UNIQUE INDEX "programas_nucleo_nome_ativo_key"
  ON "programas" (COALESCE("nucleo_id", '00000000-0000-0000-0000-000000000000'::uuid), lower("nome"))
  WHERE "deleted_at" IS NULL;

-- 4. Indicadores: código único entre não excluídos
CREATE UNIQUE INDEX "indicadores_codigo_ativo_key"
  ON "indicadores" ("codigo")
  WHERE "deleted_at" IS NULL AND "codigo" IS NOT NULL;

-- 5. Indicadores: INSTITUCIONAL não tem núcleo; NUCLEO exige núcleo
ALTER TABLE "indicadores"
  ADD CONSTRAINT "indicadores_escopo_nucleo_check"
  CHECK (
    ("escopo" = 'INSTITUCIONAL' AND "nucleo_id" IS NULL)
    OR ("escopo" = 'NUCLEO' AND "nucleo_id" IS NOT NULL)
  );

-- 6. Registros: um valor por indicador/ano/trimestre entre não excluídos
CREATE UNIQUE INDEX "indicador_registros_indicador_periodo_ativo_key"
  ON "indicador_registros" ("indicador_id", "ano", "trimestre")
  WHERE "deleted_at" IS NULL;

-- 7. Auditoria imutável: bloqueia UPDATE e DELETE em audit_logs
CREATE OR REPLACE FUNCTION "audit_logs_imutavel"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs é somente inserção: % não é permitido', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_logs_bloqueia_alteracao"
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "audit_logs_imutavel"();
