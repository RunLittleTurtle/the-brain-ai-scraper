<!--
This document is the single source of truth for the LLM coding assistant. The LLM should reference, update, and maintain this doc as the project evolves. All architectural, design, and implementation decisions should be reflected here.
-->

# Test Coverage Overview

This document provides a clear, human- and LLM-readable summary of all automated tests in the codebase. It explains what each test covers, the happy path, edge/error paths, and the rationale for each feature and regression test.

---

## Table of Contents
- [Regression Tests](#regression-tests)
- [Integration Tests](#integration-tests)
- [Feature Tests](#feature-tests)
  - [Build Processor](#build-processor)
  - [LLM Analysis & Tool Selection](#llm-analysis--tool-selection)
  - [Sample Generation](#sample-generation)
  - [Toolbox & MCP Compliance](#toolbox--mcp-compliance)
- [How to Add New Tests](#how-to-add-new-tests)

---

## Regression Tests

### File: `src/regression/regression.test.ts`
- **Purpose:** Ensures no breaking changes across the application. Covers integration between modules, database, and tool orchestration.
- **Happy Path:**
  - End-to-end build process completes successfully with valid inputs.
- **Other Paths:**
  - Handles missing/malformed Prisma files (should fail gracefully).
  - Handles database connection errors.
  - Handles invalid targetUrls: build status updates to FAILED.

### File: `src/regression/the-brain-app.regression.test.ts`
- **Purpose:** Comprehensive regression suite for The Brain App. Tests full app flow, error handling, business logic, security, and infrastructure. All major flows, error scenarios, and edge cases are covered.
- **Happy Path:**
  - Build is processed, analyzed by LLM, tools are selected, samples are generated, and cleanup occurs.
- **Negative/Error Paths:**
  - LLM analysis fails (simulated API error): build status updates to FAILED.
  - Execution failure: error is logged, build status updates accordingly.
  - Tool execution error: tool crash is handled, build status updates to FAILED.
  - DB connection failure: simulated, error is logged and surfaced.
  - Partial execution: partial results are handled and recorded, build status updates to FAILED.
  - Invalid/malformed targetUrls: build status not updated, error is logged.
  - Malformed build config: analysis is called with null/invalid fields.
- **Security/Auth:**
  - Requests with missing or invalid API key are rejected with 401 Unauthorized.
- **Orchestration Modes:**
  - Classic, MCP, and both modes are simulated via environment variable. Fallback from MCP to classic is tested.
- **Edge Cases:**
  - Handles empty input (no target URLs), malformed configs, partial results.
- **Concurrency:**
  - Multiple builds are processed in parallel (simulated), ensuring no race conditions or shared state bugs.
- **Infrastructure:**
  - Podman build and PostgreSQL connection are validated as part of the regression suite.

> See the actual regression file for the latest and most detailed test logic and coverage. All new features and bugfixes must add/extend tests here.

### File: `tests/container.integration.test.ts`
- **Purpose:** Verify that the application's Docker image can be successfully built using Podman, ensuring the container environment setup (dependencies, Prisma generation, build steps) defined in the `Dockerfile` is correct.
- **Happy Path:**
  - The `podman build` command completes successfully using the project's `Dockerfile`.
- **Other Paths:**
  - The test fails if the `podman build` command exits with an error.
  - *Note: Runtime database connectivity from within the container is not covered by this specific test.*

---

## Integration Tests

### File: `tests/database.integration.test.ts`
- **Purpose:** Verify direct connectivity from the test environment (host) to the PostgreSQL database container (`db` service) defined in `docker-compose.yml`. Ensures the database is running, accessible, and the Prisma client can establish a connection using the correct credentials.
- **Prerequisites:** The PostgreSQL container (`db` service) must be running (e.g., via `docker-compose up -d db`) before executing this test.
- **Happy Path:**
  - Prisma client successfully connects (`$connect()`) to the database at `localhost:5432`.
- **Other Paths:**
  - The test fails if the Prisma client cannot connect (e.g., database container not running, incorrect credentials, network issue).

---

## Feature Tests

### File: `src/jobs/build.processor.test.ts`
#### Suite: `processBuildJob`
- **Purpose:** Unit and integration tests for the build processing logic.

- **Happy Path:**
  - Build in `PENDING_ANALYSIS` state is processed, LLM analyzes, tools are selected, and status is updated.

- **Other Paths:**
  - Build not in `PENDING_ANALYSIS`: logs warning, skips job.
  - No target URLs: status set to FAILED.
  - LLM analysis fails: status set to FAILED, error logged.
  - Processing error (e.g., DB error): status set to FAILED, error logged.

#### Suite: `LLM Analysis & Tool Selection`
- **Purpose:** Ensures LLM receives correct toolbox, selects tools, and outputs a valid configuration package.
- **Happy Path:**
  - LLM receives toolbox, selects appropriate scraper and aux tools, and returns valid `UniversalConfigurationPackageFormatV1`.
- **Other Paths:**
  - LLM returns invalid/malformed JSON: error is handled, build status set to FAILED.
  - LLM cannot identify suitable tool: error is handled, build status set to FAILED.

#### Suite: `Sample Generation`
- **Purpose:** Ensures sample data is generated using the selected tools.
- **Happy Path:**
  - Samples are generated for all target URLs using the configured tool(s).
- **Other Paths:**
  - Tool execution fails for a URL: partial success is recorded, error is logged.

#### Suite: `Toolbox & MCP Compliance`
- **Purpose:** Ensures all tools are MCP-compliant, discoverable, and invokable by name and schema.
- **Happy Path:**
  - All registered tools expose MCP metadata and can be listed and called.
- **Other Paths:**
  - Tool missing MCP definition: error is logged, tool is skipped.

---

## How to Add New Tests
- Place new feature/unit tests in a relevant subdirectory within the `tests` folder (e.g., `tests/modules/feature/feature.test.ts`).
- For integration tests (like database or external service checks), place them in `tests/integration/` or directly in `tests/` if structure is simple.
- For end-to-end or regression tests, add to `tests/regression/`.
- Document each new test here under the appropriate section (Regression, Integration, Feature) with:
  - **Purpose**
  - **Happy Path**
  - **Other Paths** (edge cases, error handling)

---

## Notes
- This document should be updated with every new feature or regression test.
- The goal is to provide a single source of truth for test coverage, aiding both human operators and LLM agents in understanding the system's reliability and coverage.
