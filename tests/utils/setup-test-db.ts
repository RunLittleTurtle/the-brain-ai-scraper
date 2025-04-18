/**
 * Test Database Setup Helper
 * 
 * This script creates the necessary database schema for tests.
 * It should be run before executing the test suite to ensure
 * the test database has the correct schema.
 */

import { PrismaClient } from '../../src/generated/prisma/index.js';
import { TEST_DATABASE_URL } from './test-db-helper.js';

export async function setupTestDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: TEST_DATABASE_URL,
      },
    },
  });

  try {
    console.log(`Setting up test database schema at ${TEST_DATABASE_URL}...`);

    // Create the BuildStatus enum if it doesn't exist
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'buildstatus') THEN
          CREATE TYPE "BuildStatus" AS ENUM (
            'PENDING_ANALYSIS',
            'GENERATING_SAMPLES',
            'PENDING_USER_FEEDBACK',
            'CONFIRMED',
            'ANALYSIS_FAILED',
            'FAILED',
            'PROCESSING_FEEDBACK'
          );
        END IF;
      END $$;
    `;

    // Create the RunStatus enum if it doesn't exist
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'runstatus') THEN
          CREATE TYPE "RunStatus" AS ENUM (
            'PENDING',
            'RUNNING',
            'COMPLETED',
            'FAILED'
          );
        END IF;
      END $$;
    `;

    // Create the Build table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Build" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "targetUrls" TEXT NOT NULL,
        "userObjective" TEXT NOT NULL,
        "status" "BuildStatus" NOT NULL DEFAULT 'PENDING_ANALYSIS',
        "error" TEXT,
        "initialPackageJson" JSONB,
        "sampleResultsJson" JSONB,
        "userFeedbackJson" JSONB,
        "finalConfigurationJson" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
      )
    `;

    // Create the Run table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Run" (
        "id" TEXT NOT NULL,
        "buildId" TEXT NOT NULL,
        "targetUrls" TEXT NOT NULL,
        "status" "RunStatus" NOT NULL DEFAULT 'PENDING',
        "resultJson" JSONB,
        "error" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
      )
    `;

    // Create the foreign key constraint if it doesn't exist
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Run_buildId_fkey'
        ) THEN
          ALTER TABLE "Run" ADD CONSTRAINT "Run_buildId_fkey" 
            FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `;

    console.log('Test database schema setup complete.');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (process.argv[1].endsWith('setup-test-db.ts') || 
    process.argv[1].endsWith('setup-test-db.js')) {
  setupTestDatabase()
    .then(() => {
      console.log('Test database setup completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test database setup failed:', error);
      process.exit(1);
    });
}
