/*
  Warnings:

  - Made the column `whatsapp` on table `Profile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "whatsapp" SET NOT NULL;
