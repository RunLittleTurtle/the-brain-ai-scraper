import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '../src/generated/prisma/index.js';

// Connection details based on docker-compose.yml
// Assumes the 'db' service is running and port 5432 is exposed to localhost
const DATABASE_URL_TEST = 'postgresql://postgres:postgres@localhost:5432/brain_db?schema=public';

describe.skip('Database Integration Tests (skipped: enable when DB infra ready)', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    // Instantiate Prisma Client specifically for this test
    // using the direct connection string to localhost
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL_TEST,
        },
      },
    });
  });

  afterAll(async () => {
    // Disconnect Prisma client after tests
    await prisma.$disconnect();
  });

  // Set a reasonable timeout for connection attempts
  const connectionTimeoutMs = 15000; // 15 seconds

  it('should connect to the PostgreSQL database successfully', async () => {
    try {
      console.log(`Attempting to connect to database: ${DATABASE_URL_TEST}...`);
      // Attempt to connect
      await prisma.$connect();
      console.log('Successfully connected to the database.');
      // Optional: Perform a simple query to be extra sure
      // const result = await prisma.$queryRaw`SELECT 1`;
      // expect(result).toBeDefined();
      expect(true).toBe(true); // Explicit assertion for successful connection
    } catch (error) {
      console.error('Database connection failed:', error);
      // Provide a helpful error message if connection fails
      expect.fail(
        `Failed to connect to the database at ${DATABASE_URL_TEST}. ` +
        `Ensure the PostgreSQL container ('db' service in docker-compose) is running. Error: ${error}`
      );
    }
  }, connectionTimeoutMs);

});
