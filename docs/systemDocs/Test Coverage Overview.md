<!--
This document is the single source of truth for the LLM coding assistant. The LLM should reference, update, and maintain this doc as the project evolves. All architectural, design, and implementation decisions should be reflected here.
-->

# Test Coverage Overview

This document provides a clear, human- and LLM-readable summary of all automated tests in the codebase. It explains what each test covers, the happy path, edge/error paths, and the rationale for each feature and regression test.

---

## Table of Contents
- [Regression Tests](#regression-tests)
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

### File: `src/regression/the-brain-app.regression.test.ts`
- **Purpose:** Tests the full app flow, from build request to sample generation and cleanup.
- **Happy Path:**
  - Build is processed, analyzed by LLM, tools are selected, samples are generated, and cleanup occurs.
- **Other Paths:**
  - LLM analysis fails (simulated API error): build status updates to FAILED.
  - Execution failure: error is logged, build status updates accordingly.
  - Invalid targetUrls: build status updates to FAILED.

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
- Place new feature/unit tests in the relevant module directory (e.g., `src/modules/feature/feature.test.ts`).
- For end-to-end or regression tests, add to `src/regression/`.
- Document each new test here with:
  - **Purpose**
  - **Happy Path**
  - **Other Paths** (edge cases, error handling)

---

## Notes
- This document should be updated with every new feature or regression test.
- The goal is to provide a single source of truth for test coverage, aiding both human operators and LLM agents in understanding the system's reliability and coverage.
