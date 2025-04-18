/*
  Warnings:

  - You are about to drop the column `finalConfigurationJson` on the `Build` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BuildStatus" ADD VALUE 'READY_FOR_SCRAPING';
ALTER TYPE "BuildStatus" ADD VALUE 'SCRAPING_IN_PROGRESS';
ALTER TYPE "BuildStatus" ADD VALUE 'PARTIAL_SUCCESS';
ALTER TYPE "BuildStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "BuildStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Build" DROP COLUMN "finalConfigurationJson",
ADD COLUMN     "finalPackageJson" JSONB,
ADD COLUMN     "metadata" JSONB;
