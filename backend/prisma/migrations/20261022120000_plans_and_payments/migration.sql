-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('PLAN_SUBSCRIPTION', 'ASESORIA_ESCROW');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'YAPE');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('TEST', 'LIVE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HELD', 'RELEASED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_UPDATE';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "profileViews" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "PlanType" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "mode" "PaymentMode" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "commissionCents" INTEGER NOT NULL DEFAULT 0,
    "payoutCents" INTEGER,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PEN',
    "description" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "payeeId" TEXT,
    "applicationId" TEXT,
    "planPeriod" "BillingPeriod",
    "cardBrand" TEXT,
    "cardLast4" VARCHAR(4),
    "cardHolder" TEXT,
    "yapeOperation" TEXT,
    "declineReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "payoutSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "proMonthlyCents" INTEGER NOT NULL DEFAULT 990,
    "proYearlyCents" INTEGER NOT NULL DEFAULT 8990,
    "freeCommissionBps" INTEGER NOT NULL DEFAULT 1000,
    "cardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "yapeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "yapePhone" TEXT,
    "yapeHolder" TEXT,
    "payoutBank" TEXT,
    "payoutHolder" TEXT,
    "payoutAccount" TEXT,
    "payoutCci" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_code_key" ON "Payment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_applicationId_key" ON "Payment"("applicationId");

-- CreateIndex
CREATE INDEX "Payment_payerId_idx" ON "Payment"("payerId");

-- CreateIndex
CREATE INDEX "Payment_payeeId_idx" ON "Payment"("payeeId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_purpose_idx" ON "Payment"("purpose");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Request_isFeatured_idx" ON "Request"("isFeatured");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Integridad adicional (Prisma no modela CHECK constraints)
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amounts_check"
  CHECK ("amountCents" >= 0 AND "commissionCents" >= 0 AND ("payoutCents" IS NULL OR "payoutCents" >= 0));
ALTER TABLE "PaymentSettings" ADD CONSTRAINT "PaymentSettings_singleton_check" CHECK ("id" = 1);
