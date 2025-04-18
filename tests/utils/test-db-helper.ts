/**
 * Database helper for tests
 * Provides utilities for test database setup, cleanup, and mocking
 */

import { vi } from 'vitest';
import { PrismaClient } from '../../src/generated/prisma/index.js';
import { BuildRepository } from '../../src/infrastructure/db/build.repository.js';

// Use the dedicated test database
// This ensures tests never interact with production data
export const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST || 
  'postgresql://postgres:postgres@localhost:5432/postgres';

/**
 * Creates a PrismaClient instance connected to the test database
 */
export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: TEST_DATABASE_URL,
      },
    },
    // Reduce noise in test output
    log: ['error'],
  });
}

/**
 * Cleans up test data from the database
 * Should be called in beforeEach/afterEach to isolate tests
 */
export async function cleanupTestDatabase(prisma: PrismaClient): Promise<void> {
  try {
    // Delete in proper order to respect foreign key constraints
    await prisma.run.deleteMany({});
    await prisma.build.deleteMany({});
  } catch (error) {
    console.error('Test database cleanup error:', error);
    // Don't throw to avoid breaking tests during cleanup
  }
}

/**
 * Disconnects from the test database
 * Should be called in afterAll
 */
export async function disconnectTestDatabase(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test database disconnect error:', error);
  }
}

/**
 * Initializes repositories with the test database connection
 * @param prisma PrismaClient instance connected to test database
 */
export function createTestRepositories(prisma: PrismaClient) {
  return {
    buildRepository: new BuildRepository(prisma),
  };
}

/**
 * Creates a mock PrismaClient for unit tests
 * Use this when you want to avoid actual database operations
 * 
 * NOTE: This mock includes all fields from the updated schema including JSON fields
 * that might not exist in the actual test database. When using this mock, tests
 * can use the complete schema without database errors.
 */
export function createMockPrismaClient() {
  return {
    build: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn().mockImplementation(({ data }) => {
        // Handle the JSON fields that might be missing in test database
        // but expected by the code - convert nulls to JsonNull
        return { 
          ...data, 
          id: data.id || 'mock-build-id',
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date(),
          // Ensure all JSON fields are properly initialized
          errorDetailsJson: data.errorDetailsJson === undefined ? null : data.errorDetailsJson,
          initialPackageJson: data.initialPackageJson === undefined ? null : data.initialPackageJson,
          finalPackageJson: data.finalPackageJson === undefined ? null : data.finalPackageJson,
          userFeedbackJson: data.userFeedbackJson === undefined ? null : data.userFeedbackJson,
          sampleResultsJson: data.sampleResultsJson === undefined ? null : data.sampleResultsJson,
          metadata: data.metadata === undefined ? null : data.metadata
        };
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        return { 
          ...data, 
          id: where?.id || 'mock-build-id',
          updatedAt: new Date() 
        };
      }),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      // Ensure schema compatibility with transaction functions
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    run: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      // Ensure schema compatibility with transaction functions
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn().mockImplementation((callback) => callback()),
    $queryRaw: vi.fn(),
  } as unknown as PrismaClient;
}
