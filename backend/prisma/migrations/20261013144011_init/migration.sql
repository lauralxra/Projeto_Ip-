-- CreateEnum
CREATE TYPE "perfil_acesso" AS ENUM ('ADM', 'DN', 'EG', 'EC');

-- CreateEnum
CREATE TYPE "tipo_daltonismo" AS ENUM ('NENHUM', 'PROTANOPIA', 'DEUTERANOPIA', 'TRITANOPIA', 'ACROMATOPSIA');

-- CreateEnum
CREATE TYPE "tamanho_fonte" AS ENUM ('PADRAO', 'GRANDE', 'EXTRA_GRANDE');

-- CreateEnum
CREATE TYPE "status_registro" AS ENUM ('ATIVO', 'INATIVO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "tipo_dado_indicador" AS ENUM ('NUMERICO', 'PERCENTUAL', 'MOEDA');

-- CreateEnum
CREATE TYPE "escopo_indicador" AS ENUM ('INSTITUCIONAL', 'NUCLEO');

-- CreateEnum
CREATE TYPE "trimestre_enum" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- CreateEnum
CREATE TYPE "status_aprovacao" AS ENUM ('PENDENTE', 'EM_PREENCHIMENTO', 'ENVIADO_REVISAO', 'NECESSITA_CORRECAO', 'APROVADO', 'PUBLICADO');

-- CreateEnum
CREATE TYPE "status_periodo" AS ENUM ('ABERTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "status_importacao" AS ENUM ('PROCESSANDO', 'CONCLUIDA', 'CONCLUIDA_COM_ERROS', 'FALHA');

-- CreateEnum
CREATE TYPE "tipo_notificacao" AS ENUM ('SISTEMA', 'PRAZO_PREENCHIMENTO', 'DEVOLUCAO_INDICADOR', 'AVISO_GERAL');

-- CreateEnum
CREATE TYPE "acao_auditoria" AS ENUM ('CRIAR', 'ATUALIZAR', 'DESATIVAR', 'ARQUIVAR', 'EXCLUIR_LOGICO', 'RESTAURAR', 'APROVAR', 'DEVOLVER', 'PUBLICAR', 'IMPORTAR');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "foto_url" TEXT,
    "perfil" "perfil_acesso",
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_acesso" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_accessibility" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "cor_daltonismo" "tipo_daltonismo" NOT NULL DEFAULT 'NENHUM',
    "audiodescricao" BOOLEAN NOT NULL DEFAULT false,
    "tamanho_fonte" "tamanho_fonte" NOT NULL DEFAULT 'PADRAO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_accessibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "codigo_hash" VARCHAR(255) NOT NULL,
    "expira_em" TIMESTAMPTZ(6) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nucleos" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "sigla" VARCHAR(20) NOT NULL,
    "descricao" TEXT,
    "cor_hex" VARCHAR(7),
    "imagem_url" TEXT,
    "status" "status_registro" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "nucleos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_nucleos" (
    "user_id" UUID NOT NULL,
    "nucleo_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_nucleos_pkey" PRIMARY KEY ("user_id","nucleo_id")
);

-- CreateTable
CREATE TABLE "programas" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "nucleo_id" UUID,
    "status" "status_registro" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "programas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acoes" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "programa_id" UUID NOT NULL,
    "status" "status_registro" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "acoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicadores" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50),
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "tipo_dado" "tipo_dado_indicador" NOT NULL DEFAULT 'NUMERICO',
    "unidade_medida" VARCHAR(50),
    "escopo" "escopo_indicador" NOT NULL,
    "status" "status_registro" NOT NULL DEFAULT 'ATIVO',
    "nucleo_id" UUID,
    "programa_id" UUID,
    "acao_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "indicadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas" (
    "id" UUID NOT NULL,
    "indicador_id" UUID NOT NULL,
    "ano" INTEGER NOT NULL,
    "trimestre" "trimestre_enum",
    "valor_meta" DECIMAL(15,2) NOT NULL,
    "descricao" TEXT,
    "status" "status_registro" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "metas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicador_registros" (
    "id" UUID NOT NULL,
    "indicador_id" UUID NOT NULL,
    "ano" INTEGER NOT NULL,
    "trimestre" "trimestre_enum" NOT NULL,
    "valor_realizado" DECIMAL(15,2),
    "meta_aplicada" DECIMAL(15,2),
    "status_aprovacao" "status_aprovacao" NOT NULL DEFAULT 'PENDENTE',
    "justificativa_devolucao" TEXT,
    "observacoes" TEXT,
    "responsavel_id" UUID,
    "aprovador_id" UUID,
    "publicado_por_id" UUID,
    "enviado_em" TIMESTAMPTZ(6),
    "revisado_em" TIMESTAMPTZ(6),
    "publicado_em" TIMESTAMPTZ(6),
    "importacao_id" UUID,
    "status" "status_registro" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "indicador_registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos_coleta" (
    "id" UUID NOT NULL,
    "ano" INTEGER NOT NULL,
    "trimestre" "trimestre_enum" NOT NULL,
    "abertura_em" TIMESTAMPTZ(6) NOT NULL,
    "prazo_em" TIMESTAMPTZ(6) NOT NULL,
    "status" "status_periodo" NOT NULL DEFAULT 'ABERTO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "periodos_coleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importacoes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "nucleo_id" UUID,
    "arquivo_nome" VARCHAR(255) NOT NULL,
    "status" "status_importacao" NOT NULL DEFAULT 'PROCESSANDO',
    "total_linhas" INTEGER,
    "linhas_ok" INTEGER,
    "erros" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado_em" TIMESTAMPTZ(6),

    CONSTRAINT "importacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" "tipo_notificacao" NOT NULL DEFAULT 'AVISO_GERAL',
    "link_destino" VARCHAR(255),
    "criador_id" UUID,
    "nucleo_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao_usuarios" (
    "notificacao_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "email_enviado_em" TIMESTAMPTZ(6),
    "email_erro" TEXT,

    CONSTRAINT "notificacao_usuarios_pkey" PRIMARY KEY ("notificacao_id","user_id")
);

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_replies" (
    "id" UUID NOT NULL,
    "conteudo" TEXT NOT NULL,
    "post_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "forum_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "acao" "acao_auditoria" NOT NULL,
    "entidade" VARCHAR(100) NOT NULL,
    "entidade_id" UUID NOT NULL,
    "dados_antigos" JSONB,
    "dados_novos" JSONB,
    "ip_origem" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "email_tentado" VARCHAR(150) NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "ip_origem" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_categories" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_items" (
    "id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "pergunta" VARCHAR(255) NOT NULL,
    "resposta" TEXT NOT NULL,
    "perfil_alvo" "perfil_acesso",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_perfil_idx" ON "users"("perfil");

-- CreateIndex
CREATE UNIQUE INDEX "user_accessibility_user_id_key" ON "user_accessibility"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_usado_idx" ON "password_reset_tokens"("user_id", "usado");

-- CreateIndex
CREATE INDEX "nucleos_status_idx" ON "nucleos"("status");

-- CreateIndex
CREATE INDEX "user_nucleos_nucleo_id_idx" ON "user_nucleos"("nucleo_id");

-- CreateIndex
CREATE INDEX "programas_nucleo_id_idx" ON "programas"("nucleo_id");

-- CreateIndex
CREATE INDEX "programas_status_idx" ON "programas"("status");

-- CreateIndex
CREATE INDEX "acoes_programa_id_idx" ON "acoes"("programa_id");

-- CreateIndex
CREATE INDEX "indicadores_nucleo_id_idx" ON "indicadores"("nucleo_id");

-- CreateIndex
CREATE INDEX "indicadores_programa_id_idx" ON "indicadores"("programa_id");

-- CreateIndex
CREATE INDEX "indicadores_acao_id_idx" ON "indicadores"("acao_id");

-- CreateIndex
CREATE INDEX "indicadores_status_idx" ON "indicadores"("status");

-- CreateIndex
CREATE INDEX "metas_indicador_id_ano_idx" ON "metas"("indicador_id", "ano");

-- CreateIndex
CREATE INDEX "indicador_registros_indicador_id_ano_trimestre_idx" ON "indicador_registros"("indicador_id", "ano", "trimestre");

-- CreateIndex
CREATE INDEX "indicador_registros_status_aprovacao_idx" ON "indicador_registros"("status_aprovacao");

-- CreateIndex
CREATE INDEX "indicador_registros_ano_trimestre_idx" ON "indicador_registros"("ano", "trimestre");

-- CreateIndex
CREATE INDEX "indicador_registros_responsavel_id_idx" ON "indicador_registros"("responsavel_id");

-- CreateIndex
CREATE INDEX "indicador_registros_importacao_id_idx" ON "indicador_registros"("importacao_id");

-- CreateIndex
CREATE INDEX "periodos_coleta_status_idx" ON "periodos_coleta"("status");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_coleta_ano_trimestre_key" ON "periodos_coleta"("ano", "trimestre");

-- CreateIndex
CREATE INDEX "importacoes_user_id_idx" ON "importacoes"("user_id");

-- CreateIndex
CREATE INDEX "importacoes_status_idx" ON "importacoes"("status");

-- CreateIndex
CREATE INDEX "notificacoes_tipo_idx" ON "notificacoes"("tipo");

-- CreateIndex
CREATE INDEX "notificacoes_nucleo_id_idx" ON "notificacoes"("nucleo_id");

-- CreateIndex
CREATE INDEX "notificacao_usuarios_user_id_is_read_idx" ON "notificacao_usuarios"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "forum_posts_author_id_idx" ON "forum_posts"("author_id");

-- CreateIndex
CREATE INDEX "forum_replies_post_id_idx" ON "forum_replies"("post_id");

-- CreateIndex
CREATE INDEX "forum_replies_author_id_idx" ON "forum_replies"("author_id");

-- CreateIndex
CREATE INDEX "audit_logs_entidade_entidade_id_idx" ON "audit_logs"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "login_logs_user_id_idx" ON "login_logs"("user_id");

-- CreateIndex
CREATE INDEX "login_logs_email_tentado_created_at_idx" ON "login_logs"("email_tentado", "created_at");

-- CreateIndex
CREATE INDEX "login_logs_ip_origem_created_at_idx" ON "login_logs"("ip_origem", "created_at");

-- CreateIndex
CREATE INDEX "faq_items_categoria_id_idx" ON "faq_items"("categoria_id");

-- AddForeignKey
ALTER TABLE "user_accessibility" ADD CONSTRAINT "user_accessibility_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_nucleos" ADD CONSTRAINT "user_nucleos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_nucleos" ADD CONSTRAINT "user_nucleos_nucleo_id_fkey" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programas" ADD CONSTRAINT "programas_nucleo_id_fkey" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acoes" ADD CONSTRAINT "acoes_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores" ADD CONSTRAINT "indicadores_nucleo_id_fkey" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores" ADD CONSTRAINT "indicadores_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores" ADD CONSTRAINT "indicadores_acao_id_fkey" FOREIGN KEY ("acao_id") REFERENCES "acoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas" ADD CONSTRAINT "metas_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_registros" ADD CONSTRAINT "indicador_registros_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_registros" ADD CONSTRAINT "indicador_registros_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_registros" ADD CONSTRAINT "indicador_registros_aprovador_id_fkey" FOREIGN KEY ("aprovador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_registros" ADD CONSTRAINT "indicador_registros_publicado_por_id_fkey" FOREIGN KEY ("publicado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_registros" ADD CONSTRAINT "indicador_registros_importacao_id_fkey" FOREIGN KEY ("importacao_id") REFERENCES "importacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacoes" ADD CONSTRAINT "importacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacoes" ADD CONSTRAINT "importacoes_nucleo_id_fkey" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_criador_id_fkey" FOREIGN KEY ("criador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_nucleo_id_fkey" FOREIGN KEY ("nucleo_id") REFERENCES "nucleos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao_usuarios" ADD CONSTRAINT "notificacao_usuarios_notificacao_id_fkey" FOREIGN KEY ("notificacao_id") REFERENCES "notificacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao_usuarios" ADD CONSTRAINT "notificacao_usuarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "faq_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
