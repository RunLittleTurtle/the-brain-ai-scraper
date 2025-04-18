-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('PENDING_ANALYSIS', 'GENERATING_SAMPLES', 'PENDING_USER_FEEDBACK', 'CONFIRMED', 'ANALYSIS_FAILED', 'FAILED', 'PROCESSING_FEEDBACK');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "targetUrls" TEXT NOT NULL,
    "userObjective" TEXT NOT NULL,
    "status" "BuildStatus" NOT NULL DEFAULT 'PENDING_ANALYSIS',
    "error" TEXT,
    "errorDetailsJson" JSONB,
    "initialPackageJson" JSONB,
    "sampleResultsJson" JSONB,
    "userFeedbackJson" JSONB,
    "finalConfigurationJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "targetUrls" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'PENDING',
    "resultJson" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;
