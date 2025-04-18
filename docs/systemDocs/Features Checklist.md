<!--
This document is the single source of truth for the LLM coding assistant. The LLM should reference, update, and maintain this doc as the project evolves. All architectural, design, and implementation decisions should be reflected here.
-->

# Features Checklist

> **Status Rule:**
> - If any sub-feature is `[LLM_In_Progress]`, the parent feature is `[LLM_In_Progress]`.
> - If all sub-features have the same status, the parent feature takes that status.
> - Otherwise, the parent feature takes the lowest (least advanced) status among its sub-features.
> - This ensures the parent feature accurately reflects overall progress and never advances past the least advanced sub-feature.
>
> **Decomposition Rule:**
> - Whenever the LLM advances a feature to `[LLM_In_Progress]`, it must immediately break down that feature into explicit sub-features, each with its own status, following the sub-feature style used in this checklist.

- [ ] **Regression Suite:** All tests in `src/regression/regression.test.ts` must pass before moving any feature to “In Review” or “Done”.


This checklist prioritizes features (P0-P3) grouping them by parent page/module, considering core user value and a logical development flow.

## Priority Legend:

*   **P0: Must-Have (Core MVP)** - Absolutely necessary features to launch the product and demonstrate its core value.
*   **P1: High Priority** - Very important features that complete the core offering and address key user needs soon after launch.
*   **P2: Medium Priority** - Useful features improving the experience or adding significant value, but can wait for a later iteration.
*   **P3: Low Priority** - "Nice-to-have", advanced, or less critical features for the initial launch.
*   **Status:** Indicated at the end of each line. The LLM and human operator should adjust the status after their manipulations. `[LLM_Backlog]` `[LLM_To_Do]` `[LLM_In_Progress]` `[LLM_Testing]` `[LLM_Test_Complete]` `[Human_Review]` `[Done]`


---

## 1. Core Build Lifecycle

> **Note:** A feature is considered testable only when all its dependencies are implemented and tested. Features marked `[Blocked]` require completion of dependencies first.

### Feature: MCP-Native Tool Orchestration - P0 [LLM_Test_Complete]
- **Sub-Features:**
  - **1.1 Unified Orchestrator Interface** - [LLM_Test_Complete]
    - Implements a single interface/class to dispatch tool calls based on orchestration mode.
  - **1.2 MCP Mode Implementation** - [LLM_Test_Complete]
    - Implements MCP protocol client for dynamic tool discovery/invocation.

  - **1.3 Dual Mode & Fallback Logic** - [LLM_Test_Complete]
    - Implements parallel execution, fallback, and logging.

  - **1.4 Orchestrator Regression Tests** - [LLM_Test_Complete]
    - End-to-end and fallback tests for all modes.

### Feature: API Endpoint for Build Initiation (`POST /builds`) - P0 [Done]

- Done Criteria:
  - All commands documented in a terminal-accessible help system.
  - Endpoint accepts JSON payload: `target_urls` (array of strings), `user_objective` (string).
  - Performs input validation (URL format, non-empty objective/URLs).
  - Performs Authentication/Authorization (e.g., API Key).
  - Generates and stores a unique `build_id` record with initial status `pending_analysis`.
  - Successfully triggers the asynchronous backend LLM analysis process, passing `build_id`, `target_urls`, and `user_objective`.
  - Returns `202 Accepted` response with `build_id` and initial status (e.g., `processing` or `analyzing`).
  - Handles auth failures and basic validation errors with appropriate HTTP status codes (400, 401/403).

### Feature: LLM Analysis Service & Tool Selection (AnalysisService) - P0 [LLM_Test_Complete]
- **Sub-Features:**
  - **2.1 AnalysisService Classic Mode** - [LLM_Test_Complete]
    - Classic mode logic and tests are complete.
  - **2.2 AnalysisService MCP Mode** - [LLM_Test_Complete]
    - MCP mode integration with orchestrator, including stub and real MCP client logic.
  - **2.3 AnalysisService Dual Mode** - [LLM_Test_Complete]
    - Dual mode integration (parallel, A/B, fallback logic).

  - **2.4 AnalysisService Error Handling & Fallback** - [LLM_Test_Complete]
    - Robust error handling for all modes, standardized error messages.

  - **2.5 AnalysisService Regression Tests** - [LLM_Test_Complete]
    - End-to-end and fallback tests for all modes.

### Feature: API Endpoint for Run Execution (`POST /runs`) - P0 [LLM_Test_Complete]
- **Sub-Features:**
  - **4.1 Route & Input Validation** - [Done]
    - Define Fastify route, validate payload (`build_id`, `target_urls`).
  - **4.2 Auth & Build State Checks** - [Done]
    - Ensure build exists, is confirmed, and user is authorized.
  - **4.3 Execution Trigger & Status Updates** - [Done]
    - Triggers execution engine, updates run status (running, completed/failed).
  - **4.4 Result Storage & Error Handling** - [Done]
    - Stores execution result, handles errors (tool failures, missing config, etc).
  - **4.5 Basic Tests** - [Done]
    - Tests for valid input and basic validation errors.
  - **4.6 Enhanced Error Handling** - [Done]
    - Consistent error responses with proper schema, including `errors` array.
  - **4.7 Regression & Integration Tests** - [LLM_Test_Complete]
    - Expanded tests for all main flows and edge/error cases.

### Feature: Modular Tool Integration & Execution Framework - P0 [LLM_Test_Complete]
- **Sub-Features:**
  - **3.1 Define Standard Tool Interface** - [LLM_Test_Complete]
    - TypeScript interface for scraping tools (Playwright, Cheerio, etc.)
  - **3.2 Define Auxiliary Tool Interfaces** - [LLM_Test_Complete]
    - Proxy manager, anti-captcha, user-agent rotator interfaces
  - **3.3 Implement Core Execution Engine** - [LLM_Test_Complete]
    - Loads and runs tools per configuration package

  - **3.4 Parameterized Tool Invocation** - [LLM_Test_Complete]
    - Passes URLs, selectors, credentials, proxy settings

  - **3.5 Standardized Results Format** - [LLM_Test_Complete]
    - All tools return results/errors in a common format


### Feature: Initial Sample Generation (Internal Process) - P0 [LLM_Test_Complete]
- **Sub-Features:**
  - **4.1 Run Initial Tool Package** - [LLM_Test_Complete]
    - Use Modular Tool Framework for sample run

  - **4.2 Capture & Store Sample Results** - [LLM_Test_Complete]
    - Store structured JSON for each sample

  - **4.3 Update Build Status on Success** - [LLM_Test_Complete]
    - Set to `pending_user_feedback`

  - **4.4 Handle Failures & Errors** - [LLM_Test_Complete]
    - Update status to `failed` with error details


### Feature: API Endpoint for Build Status & Samples (`GET /builds/{build_id}`) - P0 [LLM_Test_Complete]
- **Sub-Features:**
  - **5.1 Endpoint Input Validation** - [LLM_Test_Complete]
    - Validate build_id param, auth
  - **5.2 Return Build Status** - [LLM_Test_Complete]
    - Return status: processing, generating_samples, pending_user_feedback, etc.
  - **5.3 Return Sample Results** - [LLM_Test_Complete]
    - If pending_user_feedback, return package_results
  - **5.4 Error Handling** - [LLM_Test_Complete]
    - Handle 404, 401/403, consistent response
  - **5.5 Tests** - [LLM_Test_Complete]
    - Comprehensive tests for all scenarios


### Feature: API Endpoint for Build Refinement/Feedback (`POST /builds/{build_id}/configure`) - P1 [LLM_Test_Complete]
- **Sub-Features:**
  - **6.1 Endpoint Input Validation** - [LLM_Test_Complete]
    - Validate build_id param, JSON payload, auth
  - **6.2 State Validation** - [LLM_Test_Complete]
    - Ensure build is in feedback-accepting state

  - **6.3 Trigger LLM Refinement Process** - [LLM_Test_Complete]
    - Pass feedback, hints, context to backend

  - **6.4 Update Build Status** - [LLM_Test_Complete]
    - Set to processing_feedback, etc.

  - **6.5 Error Handling** - [LLM_Test_Complete]


### Feature: Error Reporting for Failed Builds - P0 [LLM_Test_Complete]
- **Sub-Features:**
  - **1. Enhanced Error Schema** - [LLM_Test_Complete]
    - Define standardized error schema with category, severity, timestamp, context and metadata.
  - **2. Repository Update** - [LLM_Test_Complete]
    - Updated BuildRepository with updateBuildError method to store structured error data as JSON.
    - Added support for detailed error tracking with categories and severity levels.
  - **3. Test Integration** - [LLM_Test_Complete]
    - Updated test infrastructure with enhanced mock Prisma client to handle JSON fields.
    - Fixed test compatibility issues with structured error reporting.
    - Implemented regression tests for error handling scenarios.

  - **7.3 Database Schema Updates** - [LLM_Backlog]
    - Add fields to store detailed error information
    - Support for multiple errors per build

  - **7.4 Comprehensive Error Logging** - [LLM_Backlog]
    - Log errors in a structured format for easier analysis
    - Include context information for debugging

  - **7.5 Error Reporting API Endpoint** - [LLM_Backlog]
    - Create API endpoint to expose detailed error information
    - Support filtering and pagination


### Feature: Full Scrape Execution Engine - P0 [LLM_In_Progress]
- **Sub-Features:**
  - **8.1 Enhanced Execution Engine Core** - [LLM_In_Progress]
    - Extend current engine to handle full scrapes beyond samples
    - Implement progress tracking during execution
  - **8.2 Error Handling & Recovery** - [LLM_In_Progress]
    - Implement recovery strategies for transient errors
    - Add configurable retry mechanisms
  - **8.3 Result Collection & Storage** - [LLM_In_Progress]
    - Define result storage schema and DB structure
    - Implement collection and storage of scraped data
  - **8.4 Cancellation Support** - [LLM_In_Progress]
    - Add support for cancelling running scrapes
    - Implement clean termination with partial results
  - **8.5 Edge Cases & Recovery** - [LLM_In_Progress]
    - Handle edge cases like interrupted scrapes
    - Implement job recovery mechanisms
  - **8.6 Terminal-Based Command Interface** - [LLM_In_Progress]
    - Implement CLI commands for initiating scrapes
    - Add status checking commands
    - Support feedback submission via terminal

  - **8.2 Progress Tracking** - [LLM_Backlog]
    - Add real-time progress tracking during execution
    - Store and expose progress metrics via API

  - **8.3 Robust Error Handling** - [LLM_Backlog]
    - Implement comprehensive error handling during scraping
    - Support for partial success scenarios

  - **8.4 Cancellation and Timeout Management** - [LLM_Backlog]
    - Add support for cancelling running scrapes
    - Implement intelligent timeout handling

  - **8.5 State Transition Management** - [LLM_Backlog]
    - Ensure proper database state transitions during execution
    - Handle edge cases like interrupted scrapes
    - 404, 409, 401/403 handling


### Feature: LLM Package Refinement & Tool Switching (Internal Process) - P1 [LLM_Test_Complete]
- **Sub-Features:**
  - **7.1 Receive & Process User Feedback** - [LLM_Test_Complete]
    - Extract actionable insights from feedback
  - **7.2 Refine Configuration Logic** - [LLM_Test_Complete]
    - Adjust existing config or select different tools
  - **7.3 Knowledge Base Integration** - [LLM_Backlog]
    - Incorporate insights from previous configs (Dependent on P2 Knowledge Base features)
  - **7.4 Generate & Store Refined Package** - [LLM_Testing]
    - Create new package and store temporarily
  - **7.5 Trigger Next Processes** - [LLM_Testing]
    - Call sanity check or sample generation
  - **7.6 Status Management & Error Handling** - [LLM_Testing]
    - Update statuses and handle failures

### Feature: Configuration Package Sanity Check (Internal Process - Optional Enhancement) - P2/P3 [LLM_To_Do]
- **Sub-Features:**
  - **8.1 Schema Validation** - [LLM_To_Do]
    - Validate against Universal Configuration Package Format schema
  - **8.2 Tool Existence Verification** - [LLM_To_Do]
    - Confirm all specified tools exist in the Toolbox
  - **8.3 Conditional Process Trigger** - [LLM_To_Do]
    - Trigger appropriate next steps based on validation result
  - **8.4 Error Handling & Status Updates** - [LLM_To_Do]
    - Update build status and provide specific error messages

### Feature: Universal Configuration Package Format (Internal Definition) - P0 [Done]

- Done Criteria:
  - Define a standardized JSON schema (or similar format, like TypeScript types/interfaces for validation) for representing a complete "Scraper Configuration Package".
  - This format must be capable of specifying:
    - The chosen primary scraper tool (e.g., "playwright_v1", "cheerio_parser_v2").
    - Parameters for the scraper (e.g., target selectors, data extraction logic/mapping, interaction steps).
    - Selected auxiliary tools (e.g., "proxy_manager_smart", "captcha_solver_2captcha").
    - Parameters for auxiliary tools (e.g., proxy geo-location, API keys).
    - Expected output schema/structure (optional, could be inferred).
  - This format is generated by the LLM (during initial selection and refinement).
  - This format is consumed by the "Modular Tool Integration & Execution Framework" to run builds and full scrapes.
  - This format is what gets saved as the `final_configuration` upon confirmation.

### Feature: API Endpoint for Build Confirmation (`POST /builds/{build_id}/confirm`) - P0 [LLM_Test_Complete]

- Done Criteria:
  - Endpoint accepts `build_id` via path parameter.
  - Performs Authentication/Authorization.
  - Validates that the build is in a confirmable state (e.g., `pending_user_feedback`).
  - Retrieves the *current* temporary tool configuration package (in the Universal Configuration Package Format) associated with the latest successful samples for this build.
  - Persistently stores this package as the `final_configuration`.
  - Updates the build status to `confirmed`.
  - Returns `200 OK` response.
  - Handles `build_id` not found (404).
  - Handles invalid state errors (409 Conflict or 400).
  - Handles auth failures (401/403).

### Feature: Error Reporting for Failed Builds (`GET /builds/{build_id}`) - P0 [LLM_To_Do]

- Done Criteria:
  - When a build process fails (during LLM analysis, sample generation, refinement, or sanity check), its status is updated to `failed`.
  - The `GET /builds/{build_id}` endpoint returns `status: failed` for such builds.
  - The response includes a clear, user-understandable `error` field explaining the reason (e.g., "Objective unclear", "Samples failed: Target site blocked", "Refinement failed: Feedback contradictory", "Internal Error: Invalid configuration package generated").

------

## 2. Core Run Lifecycle

### Feature: API Endpoint for Run Execution (`POST /runs`) - P0 [LLM_In_Progress]
> **Note:** This is the next feature being implemented. Status advanced to [LLM_In_Progress] as of 2025-04-16.

- **Sub-Features:**
  - **1. Route & Input Validation** - [LLM_To_Do]
    - Define Fastify route, accept JSON payload: `build_id`, `target_urls` (array of strings), validate payload shape and types.
  - **2. Authentication & Authorization** - [LLM_To_Do]
    - Verify user authentication and permissions for run execution.
  - **3. Build Existence & State Validation** - [LLM_To_Do]
    - Validate that referenced `build_id` exists and is in `confirmed` state.
  - **4. Retrieve Final Configuration** - [LLM_To_Do]
    - Fetch the stored `final_configuration` (Universal Package Format) for the build.
  - **5. Target URLs Validation** - [LLM_To_Do]
    - Validate all provided `target_urls` for correct format and accessibility.
  - **6. Run Record Creation** - [LLM_To_Do]
    - Generate and persist a unique `run_id` and run record in the database.
  - **7. Trigger Scraping Execution** - [LLM_To_Do]
    - Start asynchronous full scraping process, passing `run_id`, `target_urls`, and `final_configuration` to the execution engine.
  - **8. Response Handling** - [LLM_To_Do]
    - Return `202 Accepted` response with `run_id` and initial status (e.g., `pending`, `running`).
  - **9. Error Handling** - [LLM_To_Do]
    - Handle validation errors (invalid `build_id`, state, bad URLs) and auth failures (400, 401/403, 404).


### Feature: Full Scrape Execution Engine (Internal Process) - P0 [LLM_To_Do]

- Done Criteria:
  - Backend process receives `run_id`, `target_urls`, and `final_configuration`.
  - Uses the "Modular Tool Integration & Execution Framework" to execute the specified configuration package against *all* provided `target_urls`.
  - Manages parallel execution (scaling workers based on URL count/system load).
  - Handles transient errors (e.g., network timeouts, temporary blocks) with appropriate retry logic configured within the framework or package.
  - Aggregates results (successful JSON outputs and any persistent errors per URL).
  - Updates run status periodically (e.g., `running` with progress) and finally to `completed` or `failed`.
  - Stores the aggregated results associated with the `run_id`.

### Feature: Terminal-based CLI with MCP Integration - P1 [LLM_Test_Complete]

- **Description:** Implement a robust terminal-based command interface for interacting with the REST API, with specific enhancements for MCP orchestration visibility and control.
- **Done Criteria:**
  - **1. Command Structure** - [LLM_Test_Complete]
    - Implements modular command structure with intuitive subcommands for each phase of the scraping workflow.
    - All commands documented in a terminal-accessible help system.
  - **2. MCP Orchestration Mode Support** - [LLM_Test_Complete]
    - CLI provides options to specify orchestration mode (classic, MCP, dual) when creating scrape jobs.
    - Status commands show detailed information about which tools were selected by the MCP protocol.
    - Support for visualizing tool performance metrics from dual mode operation.
  - **3. Authentication & Security** - [LLM_Test_Complete]
    - Proper API key handling for all requests to the REST API endpoints.
    - Secure storage of credentials in configuration file.
  - **4. Interactive Workflow Support** - [LLM_In_Progress]
    - Commands for all phases: job creation, status checking, proposal feedback, sample feedback, and results retrieval.
    - Watch mode for real-time status updates with intelligent polling.
    - Rich terminal output with color coding and progress visualization.
  - **5. Results Management** - [LLM_In_Progress]
    - Support for exporting results in multiple formats (JSON, CSV).
    - Pagination and filtering options for large result sets.

### Feature: API Endpoint for Run Status (`GET /runs/{run_id}`) - P0 [LLM_To_Do]

- Done Criteria:
  - Endpoint accepts `run_id` via path parameter.
  - Performs Authentication/Authorization.
  - Returns current run status (`pending`, `running`, `completed`, `failed`, `canceled`).
  - (P1 enhancement): If `running`, includes progress metrics (e.g., `progress_percent`, `urls_processed`, `urls_total`, `errors_encountered`).
  - Handles `run_id` not found (404).
  - Handles auth failures (401/403).

### Feature: API Endpoint for Run Results Retrieval (`GET /runs/{run_id}/results`) - P0 [LLM_To_Do]

- Done Criteria:
  - Endpoint accepts `run_id` via path parameter.
  - Performs Authentication/Authorization.
  - Validates that the run status is `completed` (or perhaps `failed` if partial results are enabled).
  - Returns `200 OK` response containing the array of structured JSON results (and potentially per-URL errors if applicable).
  - Handles `run_id` not found (404).
  - Handles cases where the run is not `completed` (e.g., return status or appropriate error 409/400).
  - Handles auth failures (401/403).
  - (P2/P3 Consideration): Implement pagination (`limit`, `offset` params) for large result sets.

### Feature: Error Reporting for Failed Runs (`GET /runs/{run_id}`) - P0 [LLM_To_Do]

- Done Criteria:
  - When a run process fails (e.g., critical tool error, excessive URL failures), its status is updated to `failed`.
  - The `GET /runs/{run_id}` endpoint returns `status: failed` for such runs.
  - The response includes a clear, user-understandable `error` field detailing the overall failure reason (e.g., "Run failed: >50% URLs resulted in errors", "Critical component failure: Proxy Manager").
  - (P1 Requirement): Define and implement policy on whether `GET /runs/{run_id}/results` should return partial data for failed runs.

### Feature: API Endpoint for Run Cancellation (`POST /runs/{run_id}/cancel` or `DELETE /runs/{run_id}`) - P1 [LLM_Backlog]

- Done Criteria:
  - Endpoint accepts `run_id` via path parameter.
  - Performs Authentication/Authorization.
  - Validates that the run exists and is in the `running` state.
  - Successfully sends a termination signal to the backend execution engine managing that run.
  - Returns `202 Accepted` response immediately.
  - Backend attempts graceful shutdown of running workers for the run; run status is eventually updated to `canceled`.
  - Handles `run_id` not found (404).
  - Handles invalid state errors (e.g., trying to cancel a completed run) (409 Conflict or 400).
  - Handles auth failures (401/403).

------

## 3. Learning / Knowledge Base Features

### Feature: Knowledge Base - Save Successful Configuration Package - P2 [LLM_Backlog]

- Done Criteria:
  - Process triggers automatically and successfully upon `POST /builds/{id}/confirm`.
  - Correctly extracts/derives `final_configuration` (in Universal Package Format), `platform_identifiers`, and `output_schema` from the confirmed build context.
  - Optionally captures/embeds `user_objective`.
  - Stores the captured data reliably in the designated knowledge base DB (e.g., Vector DB + Structured DB).
  - Ensures the stored data is indexed appropriately for later retrieval based on platform, schema, and objective similarity.
  - Saving process adds minimal latency to the user's confirmation request.
  - Failures during saving are logged but do not prevent the build confirmation from succeeding for the user.

### Feature: Knowledge Base - Leverage Past Configuration Packages - P2 [LLM_Backlog]

- Done Criteria:

  - Process triggers automatically at the start of a new `POST /builds` request processing (before "LLM Analysis & Initial Tool Selection").

  - Successfully queries the knowledge base using criteria derived from the new request (platform, objective, etc.).

  - Implements logic to rank and select relevant results from the knowledge base.

  - Implements logic to

     

    either

    :

    - Directly use a high-confidence matched configuration package as the initial package for "Initial Sample Generation" (*fast path*), OR
    - Provide retrieved example packages as context to the "LLM Analysis & Initial Tool Selection" process or the "LLM Package Refinement" process.

  - Logs whether and how past knowledge was used for a given build.

  - Knowledge base lookup adds acceptable latency to the overall build initiation phase.

  - Requires "Knowledge Base - Save Successful Configuration Package" feature to be functional.

------

## 4. System Transparency & Manual Control Features

### Feature: API Endpoint for Tool Discovery (`GET /tools`) - P1 [LLM_Backlog]

- Done Criteria:
  - Endpoint is publicly accessible (or requires standard auth).
  - Returns a list (`200 OK`) of all available tools (scrapers, anti-blocking methods, proxy managers, etc.) managed by the "Modular Tool Integration & Execution Framework".
  - Each tool entry includes:
    - `tool_id` (unique identifier used in the Universal Configuration Package Format).
    - `tool_name` (human-readable name).
    - `tool_type` (e.g., "scraper", "proxy", "captcha_solver").
    - Brief `description` of its function/use case.
    - (Optional P2 Enhancement): Expected parameters/schema for the tool's configuration block within the Universal Configuration Package Format.

### Feature: API Endpoint for Manual Build (`POST /builds/manual`) - P2 [LLM_Backlog]

- Done Criteria:
  - Endpoint accepts a JSON payload containing a complete scraper configuration package defined in the **Universal Configuration Package Format**.
  - Requires Authentication/Authorization.
  - Validates the provided configuration package against the Universal Configuration Package Format schema (similar to the "Configuration Package Sanity Check").
  - Validates that all specified tools exist in the Toolbox.
  - If valid, generates a unique `build_id`, stores the provided configuration package as the *initial* temporary package, and sets status (e.g. `manual_config_provided`).
  - Triggers the "Initial Sample Generation" process using the *manually provided* package and a predefined set of sample URLs (or requires sample URLs in the request).
  - Returns `202 Accepted` with the `build_id`.
  - Allows users to bypass the LLM analysis/refinement loop for direct configuration testing or use cases where the LLM struggles. Build proceeds directly to user confirmation (`POST /builds/{id}/confirm`) after samples are reviewed via `GET /builds/{id}`.

### Feature: MCP-Native Tool Orchestration - P0 [LLM_In_Progress]
- **Description:** Enable The Brain to support three internal tool orchestration modes: classic (direct function call), MCP (Model Context Protocol), and dual (parallel execution for A/B testing). Add a config flag or environment variable (`TOOL_ORCHESTRATION_MODE=classic|mcp|dual`) to select the orchestration mode. Implement a unified orchestrator interface that routes all tool calls through a single class, dispatching to classic, MCP, or dual modes as configured. In classic mode, use a static registry or service class for tool invocation (e.g., `classicToolRegistry['toolName'](params)`). In MCP mode, use an MCP client to discover and invoke tools dynamically. In dual mode, run both in parallel, log execution times, outputs, and errors, and record which mode performed best for each request. Implement automatic fallback: if the selected mode fails, the orchestrator should fall back to the other mode and log the event.
- **Done Criteria:**
  - Config flag/env var switches between classic, MCP, and dual modes.
  - Unified orchestrator interface in place for all tool calls.
  - Classic mode uses static registry/service class pattern.
  - MCP mode discovers/invokes tools via MCP protocol.
  - Dual mode runs both implementations in parallel, logs results and performance.
  - Fallback logic is implemented and logged.
  - Documentation is updated to reflect conventions and usage.
- **Decision:** Utilize the official `@modelcontextprotocol/sdk` package for types directly, removing local overrides to ensure alignment and resolve potential conflicts.

### **[Testing_In_Progress]** Test Suite