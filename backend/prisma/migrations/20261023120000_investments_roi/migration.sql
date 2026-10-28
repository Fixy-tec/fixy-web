-- CreateEnum
CREATE TYPE "InvestmentCategory" AS ENUM ('INFRAESTRUCTURA', 'MARKETING', 'DISENO', 'DESARROLLO', 'OTROS');

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "concept" TEXT NOT NULL,
    "category" "InvestmentCategory" NOT NULL DEFAULT 'OTROS',
    "amountCents" INTEGER NOT NULL,
    "spentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Investment_spentAt_idx" ON "Investment"("spentAt");


-- Integridad adicional (Prisma no modela CHECK constraints)
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_amount_check" CHECK ("amountCents" > 0);
