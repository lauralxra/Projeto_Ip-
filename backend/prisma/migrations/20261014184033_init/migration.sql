-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bloqueioAte" TIMESTAMP(3),
ADD COLUMN     "tentativas" INTEGER NOT NULL DEFAULT 0;
