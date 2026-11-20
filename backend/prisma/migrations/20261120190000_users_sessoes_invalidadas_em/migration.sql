-- UC02: permite encerrar todas as sessões de um usuário (ex.: após recuperar a senha).
-- O JwtAuthGuard recusa tokens emitidos antes deste instante.
ALTER TABLE "users" ADD COLUMN "sessoes_invalidadas_em" TIMESTAMPTZ(6);
