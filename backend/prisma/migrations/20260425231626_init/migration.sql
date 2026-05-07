/*
  Warnings:

  - You are about to drop the column `userId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `portfolio` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `fromUserId` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `budget` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `participants` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Request` table. All the data in the column will be lost.
  - The `medal` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[requestId,applicantId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[selectedApplicationId]` on the table `Request` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `applicantId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `institution` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ratedId` to the `Rating` table without a default value. This is not possible if the table is not empty.
  - Added the required column `raterId` to the `Rating` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stars` to the `Rating` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basePoints` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `participantsNeeded` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Medal" AS ENUM ('HIERRO', 'BRONCE', 'PLATA', 'ORO', 'DIAMANTE', 'MAESTRO', 'CHALLENGER');

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_userId_fkey";

-- DropIndex
DROP INDEX "Application_userId_requestId_key";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "userId",
ADD COLUMN     "applicantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "description",
DROP COLUMN "photoUrl",
DROP COLUMN "portfolio",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "institution" TEXT NOT NULL,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "portfolioUrl" TEXT;

-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "fromUserId",
DROP COLUMN "score",
DROP COLUMN "toUserId",
ADD COLUMN     "ratedId" TEXT NOT NULL,
ADD COLUMN     "raterId" TEXT NOT NULL,
ADD COLUMN     "stars" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Request" DROP COLUMN "budget",
DROP COLUMN "participants",
DROP COLUMN "userId",
ADD COLUMN     "basePoints" INTEGER NOT NULL,
ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "economicBenefit" DOUBLE PRECISION,
ADD COLUMN     "participantsNeeded" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "medal",
ADD COLUMN     "medal" "Medal" NOT NULL DEFAULT 'HIERRO';

-- AlterTable
ALTER TABLE "UserTag" ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "PointLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ratingId" TEXT,
    "requestId" TEXT,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "medalBefore" "Medal",
    "medalAfter" "Medal",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_requestId_idx" ON "Application"("requestId");

-- CreateIndex
CREATE INDEX "Application_applicantId_idx" ON "Application"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_requestId_applicantId_key" ON "Application"("requestId", "applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "Request_selectedApplicationId_key" ON "Request"("selectedApplicationId");

-- CreateIndex
CREATE INDEX "Request_creatorId_idx" ON "Request"("creatorId");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_selectedApplicationId_fkey" FOREIGN KEY ("selectedApplicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_ratedId_fkey" FOREIGN KEY ("ratedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointLog" ADD CONSTRAINT "PointLog_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE SET NULL ON UPDATE CASCADE;
