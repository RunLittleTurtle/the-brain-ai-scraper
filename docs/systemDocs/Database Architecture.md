# Database Architecture & Testing Configuration

## Technology Stack Overview

The Brain AI Scraper uses the following technology stack:

- **Language**: TypeScript (with strict ES Module support, requiring `.js` extensions in imports)
- **Runtime**: Node.js (using ES Modules via `"type": "module"` in package.json)
- **Web Framework**: Fastify (with TypeBox for schema validation)
- **ORM**: Prisma (for type-safe database access)
- **Database**: PostgreSQL (containerized via Podman)
- **Containerization**: Podman (for development and testing services)
- **Testing**: Vitest (for unit, integration, and regression testing)

## Database Architecture Overview

The Brain AI Scraper uses PostgreSQL for data persistence with Prisma ORM for database interaction. This document outlines the database architecture, configuration, and testing approach to ensure consistent development and testing.

## Database Configurations

### Production Database

- **Connection String**: `DATABASE_URL` environment variable
- **Default Configuration**: `postgresql://postgres:password@localhost:5432/mydb`
- **Container**: `brain-db` - Primary PostgreSQL container for application use (managed via Podman)
- **Access Method**: Prisma ORM with TypeScript-generated types

### Test Database

- **Connection String**: `DATABASE_URL_TEST` environment variable (falls back to `DATABASE_URL` if not set)
- **Default Test Configuration**: `postgresql://postgres:postgres@localhost:5432/postgres`
- **Container**: `brain-db-test` - Dedicated PostgreSQL container for test isolation (managed via Podman)
- **Testing Framework**: Vitest with custom database helpers for test isolation and cleanup

## Schema Overview

The database schema includes the following primary models:

1. **Build**: Configuration and status for a scraper build
2. **Run**: Execution instances of a build against target URLs

See the [ERD](/app/docs/systemDocs/ERD.md) for a complete entity relationship diagram.

## Testing Approach

### Key Guidelines for Database Testing

1. **Always use the test database for tests**
   - Configure PrismaClient with the test database URL in all test files
   - Never use the production database for test cases

2. **Mock database operations when possible**
   - For unit tests, mock the repository layer rather than using real database connections
   - Use mocking for faster, more isolated tests

3. **When real database access is required**
   - Ensure tables exist before tests run
   - Clean up data before and after tests
   - Use proper error handling for database operations

### Test Database Setup in Tests

Here's the correct pattern for setting up tests with database access:

```typescript
// Import necessary modules
import { PrismaClient } from '../../src/generated/prisma/index.js';
import { BuildRepository } from '../../src/infrastructure/db/build.repository.js';

// Use test database configuration
const DATABASE_URL_TEST = process.env.DATABASE_URL || 'postgresql://postgres:postgres@brain-db-test:5432/postgres';

describe('Your Test Suite', () => {
  let prisma: PrismaClient;
  let buildRepository: BuildRepository;

  beforeAll(async () => {
    // Initialize Prisma with test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL_TEST,
        },
      },
    });
    
    // Create repository with test database connection
    buildRepository = new BuildRepository(prisma);
    
    // Ensure tables are clean before tests
    try {
      await prisma.run.deleteMany({});
      await prisma.build.deleteMany({});
    } catch (error) {
      console.error('Database cleanup error:', error);
    }
  });

  afterAll(async () => {
    // Clean up after tests
    try {
      await prisma.run.deleteMany({});
      await prisma.build.deleteMany({});
      await prisma.$disconnect();
    } catch (error) {
      console.error('Database cleanup error:', error);
    }
  });

  // Your test cases here
});
```

### Database Testing Utilities

The project includes comprehensive TypeScript testing utilities to simplify database tests. These utilities are located in the `tests/utils/` directory and must be used by all test files that interact with the database:

```typescript
// Import the testing utilities (note the required .js extension for TypeScript ES Modules)
import { 
  createTestPrismaClient,
  cleanupTestDatabase, 
  disconnectTestDatabase 
} from '../utils/test-db-helper.js';

// Creating a test-specific Prisma client
const prisma = createTestPrismaClient();

// Cleaning up test database before/after tests
await cleanupTestDatabase(prisma);

// Properly disconnecting from test database
await disconnectTestDatabase(prisma);
```

### Mocking Approach for Unit Tests

For unit tests where database operations should be mocked:

```typescript
import { PrismaClient, BuildStatus } from '../../src/generated/prisma/index.js';
import { BuildRepository } from '../../src/infrastructure/db/build.repository.js';
import { vi } from 'vitest';

describe('Your Unit Test Suite', () => {
  let prisma: PrismaClient;
  let buildRepository: BuildRepository;

  beforeAll(() => {
    // Mock PrismaClient
    prisma = {
      build: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      $disconnect: vi.fn(),
    } as unknown as PrismaClient;
    
    // Create repository with mocked prisma client
    buildRepository = new BuildRepository(prisma as any);
    
    // Mock repository methods
    vi.spyOn(buildRepository, 'findBuildById').mockImplementation(async (id) => {
      // Return mock data
      return {
        // Mock build data
      };
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  // Your test cases here
});

### Running Tests with Database Support

To run tests with proper database setup, use the dedicated npm scripts that properly initialize the test database before running tests:

```bash
# Run tests with proper test database setup (uses setup-test-db.ts script)
npm run test:with-db

# Or manually set the test database URL
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/postgres npm test
```

These commands ensure the test database schema is properly set up before running tests. The setup script (`setup-test-db.ts`) is written in TypeScript and executed using `ts-node-esm` to maintain consistency with the rest of the codebase.

## Common Issues & Solutions

1. **Missing Tables Error**
   - **Issue**: `The table public.Build does not exist in the current database`
   - **Solution**: Use mocking for unit tests or ensure the test database is properly initialized with required tables

2. **Type Errors with JSON Fields**
   - **Issue**: `Type 'X' is not assignable to type 'JsonValue'`
   - **Solution**: Use `JSON.parse(JSON.stringify(object))` to ensure proper JSON formatting

3. **Isolated Test Database**
   - **Issue**: Database tests interfering with each other or production data
   - **Solution**: Use dedicated test database with `test-db-helper.ts` utilities
   - **Important**: Always use consistent database access patterns in tests, including proper connection management and database cleanup

4. **File Extensions with ES Modules**
   - **Issue**: Module not found errors when imports don't include file extensions
   - **Solution**: Always include `.js` extension in imports, even for TypeScript files (e.g., `import { helper } from './helper.js'`)
   - **Reason**: Node.js ES Module resolution requires explicit extension

## Database Maintenance

- Run migrations using Prisma: `npx prisma migrate dev`
- Generate Prisma client: `npx prisma generate`
- Reset the test database: `npx prisma db push --schema=./prisma/schema.prisma --force-reset --accept-data-loss --skip-generate`

This document should be updated whenever the database schema changes or new patterns for testing are established.
