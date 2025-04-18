## Database Testing Architecture & Best Practices

To maintain reliable and consistent tests, The Brain AI Scraper uses a dedicated test database separate from the production database. This section outlines the architecture and patterns for database testing.

### Database Configuration

- **Production Database**: `brain-db` container at `postgresql://postgres:password@localhost:5432/mydb`
- **Test Database**: `brain-db-test` container at `postgresql://postgres:postgres@brain-db-test:5432/postgres`

### Test Utilities

A set of database testing utilities is available in `/app/tests/utils/test-db-helper.js`. These utilities provide consistent patterns for setting up test databases, cleaning up after tests, and mocking database operations when needed.

### Testing Patterns

**For integration tests that need a real database:**
```typescript
import { 
  createTestPrismaClient,
  cleanupTestDatabase, 
  disconnectTestDatabase 
} from '../../utils/test-db-helper.js';

describe('Your test suite', () => {
  let prisma;
  
  beforeEach(async () => {
    // Initialize with test database
    prisma = createTestPrismaClient();
    // Clean up before test
    await cleanupTestDatabase(prisma);
  });
  
  afterEach(async () => {
    // Clean up after test
    await cleanupTestDatabase(prisma);
  });
  
  afterAll(async () => {
    // Disconnect when done
    await disconnectTestDatabase(prisma);
  });
});
```

**For unit tests that should mock the database:**
```typescript
import { createMockPrismaClient } from '../../utils/test-db-helper.js';

describe('Your test suite', () => {
  let prisma;
  
  beforeEach(() => {
    // Create mock database
    prisma = createMockPrismaClient();
    // Mock specific responses as needed
    prisma.build.findUnique.mockResolvedValue({ /* mock data */ });
  });
});
```

### Running Tests with Database Support

To run tests with proper database setup:

```bash
npm run test:with-db
```

This command ensures the test database schema is properly set up before running tests.

## Test Coverage Matrix

| # | File & Suite | Test Description | Status | Why this test? |
|---|--------------|------------------|--------|----------------|
| 1 | build.processor.test.ts / Build Processor | should have test cases (placeholder) | [PASS] | A temporary placeholder test that will be replaced with detailed tests in a future PR. |
| 2 | modules/builds/build-confirmation.test.ts / POST /builds/:build_id/confirm | should confirm a build with valid ID and state | [PASS] | Verifies that a build in PENDING_USER_FEEDBACK state can be successfully confirmed, updating its status and saving the final configuration. |
| 3 | modules/builds/build-confirmation.test.ts / POST /builds/:build_id/confirm | should return 404 for non-existent build ID | [PASS] | Ensures that attempting to confirm a non-existent build returns a 404 Not Found response, preventing confusion. |
| 4 | modules/builds/build-confirmation.test.ts / POST /builds/:build_id/confirm | should return 409 for build in wrong state | [PASS] | Validates that only builds in the correct state (PENDING_USER_FEEDBACK) can be confirmed, enforcing workflow constraints. |
| 5 | modules/builds/build-confirmation.test.ts / POST /builds/:build_id/confirm | should return 500 for build missing required data | [PASS] | Ensures that builds missing sample results or configuration data cannot be confirmed, preventing corrupt or incomplete states. |
| 6 | modules/builds/build-confirmation.test.ts / POST /builds/:build_id/confirm | should handle database errors during update | [PASS] | Verifies proper error handling if database operations fail during confirmation, ensuring users get appropriate feedback. |
| 10 | analysis.service.mcp.test.ts / AnalysisService MCP Mode | should use orchestrator MCP mode and return MCP stub package | [PASS] | Verifies that the analysis service can use the MCP orchestrator mode and return a valid MCP package, confirming protocol support. |
| 11 | analysis.service.mcp.test.ts / AnalysisService MCP Mode | should handle MCP failure and return error | [PASS] | Ensures that MCP orchestrator errors are surfaced correctly to the caller, supporting robust error handling. |
| 12 | database.integration.test.ts / Database Integration Tests | should connect to the PostgreSQL database successfully | [SKIPPED] | Confirms that the application can connect to the database, a critical infrastructure dependency. Skipped if DB is not available. |
| 13 | modules/runs/runs.controller.test.ts / POST /runs | returns 200 and a run_id for valid input | [SKIPPED] | Tests the main happy path for creating a run. Currently marked as TODO: passes when run individually but fails in full test suite due to database isolation issues. |
| 14 | modules/runs/runs.controller.test.ts / POST /runs | returns 400 for invalid input | [PASS] | Ensures that invalid input is rejected with a 400 error, validating input schema enforcement. |
| 15 | orchestrator/unifiedOrchestrator.test.ts / UnifiedOrchestratorImpl | callTool returns correct mode and structure for mode: classic | [PASS] | Verifies that the orchestrator returns the correct response structure in classic mode. |
| 16 | orchestrator/unifiedOrchestrator.test.ts / UnifiedOrchestratorImpl | callTool returns correct mode and structure for mode: mcp | [PASS] | Ensures that MCP mode returns the expected structure, confirming protocol compatibility. |
| 17 | orchestrator/unifiedOrchestrator.test.ts / UnifiedOrchestratorImpl | callTool returns correct mode and structure for mode: both | [PASS] | Validates that dual mode returns the correct structure and mode field. |
| 18 | orchestrator/unifiedOrchestrator.both.test.ts / UnifiedOrchestratorImpl (Dual Mode) | callTool (mode: both) should prefer MCP if both succeed | [PASS] | Ensures the orchestrator prefers MCP output if both classic and MCP succeed, matching the intended priority. |
| 19 | orchestrator/unifiedOrchestrator.both.test.ts / UnifiedOrchestratorImpl (Dual Mode) | callTool (mode: both) should fallback to classic if MCP fails | [PASS] | Ensures fallback to classic mode if MCP fails, guaranteeing robustness in orchestrator logic. |
| 20 | orchestrator/unifiedOrchestrator.mcp.test.ts / UnifiedOrchestratorImpl (MCP Mode) | callTool (mode: mcp) should use MCPClientStub and return stub output | [PASS] | Verifies MCP mode integration returns the expected stub output, confirming correct wiring. |
| 21 | regression/get-build-status.validation.test.ts / GET /builds/:build_id input validation | should return 401 for root builds path (missing ID) | [PASS] | Ensures that requests to /builds/ without an ID are rejected with a 401 (due to auth check running before route handling). |
| 22 | regression/get-build-status.validation.test.ts / GET /builds/:build_id input validation | should reject invalid build_id format with 400 | [PASS] | Validates that only UUIDs are accepted as build IDs, ensuring strict parameter validation. |
| 23 | regression/get-build-status.validation.test.ts / GET /builds/:build_id input validation | should reject request with missing API key with 401 | [PASS] | Ensures authentication is required for build status queries, enforcing security. |
| 24 | regression/get-build-status.validation.test.ts / GET /builds/:build_id input validation | should reject request with invalid API key with 401 | [PASS] | Ensures only valid API keys are accepted, protecting the endpoint from unauthorized access. |
| 25 | regression/get-build-status.validation.test.ts / GET /builds/:build_id input validation | should return 401 for a valid build_id that does not exist | [PASS] | Confirms that requests for non-existent builds return 401 (due to auth check running before route handling). |
| 26 | regression/orchestrator.regression.test.ts / Orchestrator Regression Suite | classic mode: returns classic stub result | [PASS] | Ensures the orchestrator returns classic stub results in classic mode, verifying backward compatibility. |
| 27 | regression/orchestrator.regression.test.ts / Orchestrator Regression Suite | mcp mode: returns MCP stub result | [PASS] | Confirms MCP mode returns stub results, validating protocol switching. |
| 28 | regression/orchestrator.regression.test.ts / Orchestrator Regression Suite | both mode: prefers MCP if both succeed | [PASS] | Tests that dual mode prefers MCP results, matching design intent. |
| 29 | regression/orchestrator.regression.test.ts / Orchestrator Regression Suite | both mode: falls back to classic if MCP fails | [PASS] | Ensures dual mode falls back to classic if MCP fails, for resilience. |
| 30 | regression/the-brain-app.regression.test.ts / AnalysisResult type contract | should allow success=true only if package is present and error is absent | [PASS] | Validates the AnalysisResult type contract: success=true requires a package, no error. Prevents invalid states. |
| 31 | regression/the-brain-app.regression.test.ts / AnalysisResult type contract | should allow success=false only if error is present and package is absent | [PASS] | Ensures that failed analysis results always include an error and no package, enforcing type safety. |
| 32 | regression/the-brain-app.regression.test.ts / The Brain App - Regression Suite | processes a build end-to-end (happy path) | [PASS] | Verifies the full build processing pipeline, ensuring all major components work together as expected. |
| 33 | regression/the-brain-app.regression.test.ts / The Brain App - Regression Suite | fails gracefully if no target URLs | [PASS] | Ensures the system fails gracefully and provides clear feedback when required input is missing. |
| 34 | regression/the-brain-app.regression.test.ts / The Brain App - Regression Suite | handles analysis (LLM) failure | [PASS] | Verifies that LLM analysis errors are handled cleanly without crashing the system. |
| 35 | regression/the-brain-app.regression.test.ts / The Brain App - Regression Suite | handles execution failure | [PASS] | Ensures that execution errors are caught and reported, maintaining stability. |
| 36 | regression/the-brain-app.regression.test.ts / The Brain App - Regression Suite | handles invalid JSON in targetUrls | [PASS] | Validates the system's robustness against malformed input data. |
| 37 | container.integration.test.ts / Container Integration Tests | should build and run a container image using Podman | [SKIPPED] | Checks that the application's container image can be built and run, supporting deployment and CI/CD. Skipped if Podman is not available. |
