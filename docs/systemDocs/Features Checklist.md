<!--
This document is the single source of truth for the LLM coding assistant. The LLM should reference, update, and maintain this doc as the project evolves. All architectural, design, and implementation decisions should be reflected here.
-->

# Features Checklist

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

### Feature: MCP-Native Tool Orchestration - P0 [LLM_In_Progress]
- **Status:** `[LLM_In_Progress]` (Not fully testable; see sub-features)
- **Sub-Features:**
  - **1.1 Unified Orchestrator Interface** - [LLM_Testing]
    - Implements a single interface/class to dispatch tool calls based on orchestration mode.
  - **1.2 MCP Mode Implementation** - [LLM_Testing]
    - Implements MCP protocol client for dynamic tool discovery/invocation.
    - [Blocked] by: 1.1
  - **1.3 Dual Mode & Fallback Logic** - [LLM_Testing]
    - Implements parallel execution, fallback, and logging.
    - [Blocked] by: 1.1, 1.2
  - **1.4 Orchestrator Regression Tests** - [LLM_Testing]
    - End-to-end and fallback tests for all modes.
    - [Blocked] by: 1.1, 1.2, 1.3

### Feature: API Endpoint for Build Initiation (`POST /builds`) - P0 [Done]

- Done Criteria:
  - Endpoint accepts JSON payload: `target_urls` (array of strings), `user_objective` (string).
  - Performs input validation (URL format, non-empty objective/URLs).
  - Performs Authentication/Authorization (e.g., API Key).
  - Generates and stores a unique `build_id` record with initial status `pending_analysis`.
  - Successfully triggers the asynchronous backend LLM analysis process, passing `build_id`, `target_urls`, and `user_objective`.
  - Returns `202 Accepted` response with `build_id` and initial status (e.g., `processing` or `analyzing`).
  - Handles auth failures and basic validation errors with appropriate HTTP status codes (400, 401/403).

### Feature: LLM Analysis Service & Tool Selection (AnalysisService) - P0 [LLM_In_Progress]
- **Status:** `[LLM_In_Progress]` (Partially testable; see sub-features)
- **Sub-Features:**
  - **2.1 AnalysisService Classic Mode** - [LLM_Test_Complete]
    - Classic mode logic and tests are complete.
  - **2.2 AnalysisService MCP Mode** - [LLM_In_Progress]
    - Integrate MCP mode with orchestrator.
    - [Blocked] by: 1.2
  - **2.3 AnalysisService Dual Mode** - [LLM_To_Do]
    - Integrate dual mode (parallel, A/B, fallback).
    - [Blocked] by: 1.3, 2.2
  - **2.4 AnalysisService Error Handling & Fallback** - [LLM_To_Do]
    - Robust error handling for all modes.
    - [Blocked] by: 2.2, 2.3
  - **2.5 AnalysisService Regression Tests** - [LLM_To_Do]
    - End-to-end tests for all modes.
    - [Blocked] by: 2.2, 2.3, 2.4

### Feature: Modular Tool Integration & Execution Framework - P0 [Human_Review]
- **Status:** `[Human_Review]`
- **Sub-Features:**
  - **3.1 Define Standard Tool Interface** - [LLM_Test_Complete]
    - TypeScript interface for scraping tools (Playwright, Cheerio, etc.)
  - **3.2 Define Auxiliary Tool Interfaces** - [LLM_Test_Complete]
    - Proxy manager, anti-captcha, user-agent rotator interfaces
  - **3.3 Implement Core Execution Engine** - [LLM_Test_Complete]
    - Loads and runs tools per configuration package
    - [Blocked] by: 3.1, 3.2
  - **3.4 Parameterized Tool Invocation** - [LLM_Test_Complete]
    - Passes URLs, selectors, credentials, proxy settings
    - [Blocked] by: 3.3
  - **3.5 Standardized Results Format** - [LLM_Test_Complete]
    - All tools return results/errors in a common format
    - [Blocked] by: 3.1, 3.3

### Feature: Initial Sample Generation (Internal Process) - P0 [Human_Review]
- **Status:** `[Human_Review]`
- **Sub-Features:**
  - **4.1 Run Initial Tool Package** - [LLM_Test_Complete]
    - Use Modular Tool Framework for sample run
    - [Blocked] by: 3.3
  - **4.2 Capture & Store Sample Results** - [LLM_Test_Complete]
    - Store structured JSON for each sample
    - [Blocked] by: 4.1
  - **4.3 Update Build Status on Success** - [LLM_Test_Complete]
    - Set to `pending_user_feedback`
    - [Blocked] by: 4.2
  - **4.4 Handle Failures & Errors** - [LLM_Test_Complete]
    - Update status to `failed` with error details
    - [Blocked] by: 4.1

### Feature: API Endpoint for Build Status & Samples (`GET /builds/{build_id}`) - P0 [LLM_To_Do]
- **Status:** `[LLM_To_Do]`
- **Sub-Features:**
  - **5.1 Endpoint Input Validation** - [LLM_In_Progress]
    - Validate build_id param, auth
  - **5.2 Return Build Status** - [LLM_To_Do]
    - Return status: processing, generating_samples, pending_user_feedback, etc.
    - [Blocked] by: 5.1
  - **5.3 Return Sample Results** - [LLM_To_Do]
    - If pending_user_feedback, return package_results
    - [Blocked] by: 5.2
  - **5.4 Error Handling** - [LLM_To_Do]
    - Handle 404, 401/403, consistent response
    - [Blocked] by: 5.1

### Feature: API Endpoint for Build Refinement/Feedback (`POST /builds/{build_id}/configure`) - P1 [LLM_Backlog]
- **Status:** `[LLM_Backlog]`
- **Sub-Features:**
  - **6.1 Endpoint Input Validation** - [LLM_Backlog]
    - Validate build_id param, JSON payload, auth
  - **6.2 State Validation** - [LLM_Backlog]
    - Ensure build is in feedback-accepting state
    - [Blocked] by: 6.1
  - **6.3 Trigger LLM Refinement Process** - [LLM_Backlog]
    - Pass feedback, hints, context to backend
    - [Blocked] by: 6.2
  - **6.4 Update Build Status** - [LLM_Backlog]
    - Set to processing_feedback, etc.
    - [Blocked] by: 6.3
  - **6.5 Error Handling** - [LLM_Backlog]
    - 404, 409, 401/403 handling
    - [Blocked] by: 6.1

### Feature: LLM Package Refinement & Tool Switching (Internal Process) - P1 [LLM_Backlog]

- Done Criteria:
  - Backend refinement process receives build context and user feedback.
  - LLM analyzes the feedback in context of the previous results and objective.
  - **(Integration Point):** Incorporates relevant insights/configurations retrieved from the "**Knowledge Base - Leverage Past Configurations**" feature (if enabled and relevant matches found).
  - LLM modifies the existing tool configuration *or* selects different tools from the toolbox based on the feedback (leveraging the modular framework). This might involve changing scraper logic, adjusting anti-blocking, switching proxy types, etc.
  - Generates a *new* refined configuration package.
  - Stores the *new*, refined tool configuration package temporarily, associated with the `build_id`, replacing the previous one.
  - **(Next Step):** Triggers the "Configuration Package Sanity Check" process (if implemented) OR directly triggers the "Initial Sample Generation" process.
  - Updates build status appropriately (e.g., `validating_config` or `generating_samples`).
  - Handles LLM failures during refinement (e.g., cannot interpret feedback) by updating status to `failed`.

### Feature: Configuration Package Sanity Check (Internal Process - Optional Enhancement) - P2/P3 [LLM_Backlog]

- Done Criteria:
  - **Trigger:** Executes immediately after `LLM Package Refinement` generates a new temporary configuration package.
  - Validates the generated package against the defined **Universal Configuration Package Format** schema.
  - Verifies that all tools specified in the package exist in the system's available **Toolbox**.
  - **(Outcome):** If validation passes, proceeds to trigger "**Initial Sample Generation**".
  - **(Outcome):** If validation fails, updates the build status to `failed` with a specific error (e.g., "Internal Error: Invalid configuration package generated") and prevents the sample generation attempt.
  - Adds minimal processing overhead.

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

### Feature: API Endpoint for Build Confirmation (`POST /builds/{build_id}/confirm`) - P0 [LLM_To_Do]

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

### Feature: API Endpoint for Run Execution (`POST /runs`) - P0 [LLM_To_Do]

- Done Criteria:
  - Endpoint accepts JSON payload: `build_id`, `target_urls` (array of strings).
  - Performs Authentication/Authorization.
  - Validates that the referenced `build_id` exists and is in `confirmed` state.
  - Retrieves the stored `final_configuration` (in Universal Package Format) for the `build_id`.
  - Validates `target_urls` format.
  - Generates and stores a unique `run_id`.
  - Successfully triggers the asynchronous full scraping process, passing the `run_id`, `target_urls`, and the `final_configuration` to the execution engine.
  - Returns `202 Accepted` response with `run_id` and initial status (e.g., `pending`, `running`).
  - Handles validation errors (invalid `build_id`, non-confirmed state, bad URLs) (400, 404).
  - Handles auth failures (401/403).

### Feature: Full Scrape Execution Engine (Internal Process) - P0 [LLM_To_Do]

- Done Criteria:
  - Backend process receives `run_id`, `target_urls`, and `final_configuration`.
  - Uses the "Modular Tool Integration & Execution Framework" to execute the specified configuration package against *all* provided `target_urls`.
  - Manages parallel execution (scaling workers based on URL count/system load).
  - Handles transient errors (e.g., network timeouts, temporary blocks) with appropriate retry logic configured within the framework or package.
  - Aggregates results (successful JSON outputs and any persistent errors per URL).
  - Updates run status periodically (e.g., `running` with progress) and finally to `completed` or `failed`.
  - Stores the aggregated results associated with the `run_id`.

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