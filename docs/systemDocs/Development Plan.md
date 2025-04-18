<!--
This document is the single source of truth for the LLM coding assistant. The LLM should reference, update, and maintain this doc as the project evolves. All architectural, design, and implementation decisions should be reflected here.
-->

# Development Plan (Fastify Edition)

## 1. Introduction

### Technology Stack

The Brain AI Scraper is built on the following comprehensive technology stack:

- **Programming Language**: TypeScript 5.8+ with strict typing
- **Runtime Environment**: Node.js using ES Modules (`"type": "module"` in package.json)
- **Web Framework**: Fastify 5.x with TypeBox for schema validation
- **Database**: PostgreSQL (containerized via Podman)
- **ORM**: Prisma 6.x for type-safe database access
- **Containerization**: Podman for development services and test database isolation
- **Testing Framework**: Vitest with custom utilities for database testing
- **Build Tools**: TypeScript compiler (tsc) with ES Module output

### Important Technical Requirements

- **ES Module Import Paths**: All relative imports between TypeScript files MUST include the `.js` extension (e.g., `import { helper } from './helper.js'`) due to Node.js ES Module resolution requirements
- **Database Isolation**: All tests must use the dedicated test database helpers from `tests/utils/test-db-helper.ts` to ensure proper test isolation
- **Container Management**: Database services are managed via Podman during development

### Document Purpose

This document outlines the development plan for "The Brain" API project. It details the file structure, phased development tasks, logging strategy, initial toolbox implementation, and key considerations. This plan serves as the primary guide for the *implementation* process, complementing the Features Checklist which defines *what* needs to be built and tracks progress.

---

## 1.1 Testing Philosophy & Regression Suite Requirements

**Testing is a first-class engineering value in The Brain project.**

- All features, error paths, and business logic **must** have exhaustive regression and integration test coverage before any code is marked as `[LLM_Test_Complete]`, `[Human_Review]`, or `[Done]`.
- The regression suite (`tests/regression/the-brain-app.regression.test.ts`) is the single source of truth for end-to-end and error path coverage. Every major flow, including error and edge cases, must be represented here.
- Minimal/smoke tests or migration checks are not duplicated in the regression suite (see code comments for rationale).
- Test coverage must include:
    - Positive (happy path) and negative (failure) scenarios
    - Edge cases (empty/malformed inputs, unexpected tool outputs, partial results, etc.)
    - Security (auth, permissions, input validation)
    - All tool orchestration modes (classic, MCP, both), including fallback logic
    - Infrastructure and integration points (DB, containers, LLM providers, etc.)
- **No feature or bugfix is considered complete until it is covered by regression/integration tests.**

---



## 2. Detailed Development Plan (Phased)

This plan breaks down development into prioritized phases (P0-P3). Each task includes implementation notes using Fastify concepts and essential logging points.

### Phase P0: Core MVP - Basic Build & Run Lifecycle (Fastify)

**Goal:** Establish the Fastify project structure, core API endpoints, basic queue/DB integration, initial LLM logic (mocked ok), and a minimal execution framework with one tool.

**Tasks:**

#### MCP-Native Tool Orchestration & AnalysisService (P0, In Progress)
* **Objective:** Enable The Brain to support three internal tool orchestration modes: classic (direct function call), MCP (Model Context Protocol), and both (parallel execution for A/B testing). Integrate an `AnalysisService` that interacts with the LLM to select tools and generate initial configuration packages.
* **Implementation:**
    - Add a config flag or environment variable (`TOOL_ORCHESTRATION_MODE=classic|mcp|both`) to select the orchestration mode.
    - Implement a unified orchestrator interface that routes all tool calls through a single class, dispatching to classic, MCP, or both modes as configured.
    - In **classic** mode, use a static registry or service class for tool invocation (e.g., `classicToolRegistry['toolName'](params)`). This is the standard Node.js/TS convention and should be documented for all developers.
    - In **MCP** mode, use an MCP client to discover and invoke tools dynamically, based on protocol metadata.
    - In **both** mode, run both classic and MCP in parallel, log execution times, outputs, and errors, and record which mode performed best for each request.
    - Implement automatic fallback: if the selected mode fails, the orchestrator should fall back to the other mode and log the event.
    - **AnalysisService:** Receives build requests, calls LLM (via a pluggable LLM service, e.g., `openaiService`, `anthropicService`, etc.) to analyze objectives and URLs, selects tools, and generates the Universal Configuration Package Format V1 (UCPF). Integrates with orchestrator and supports all orchestration modes. Handles errors robustly and updates build status appropriately.
    - **LLM Provider Extensibility & API Key Management:** Developers can configure and update their API keys for any LLM provider (OpenAI, Anthropic, Grok, Gemini, Llama, Mistral, OpenRouter, etc.) via terminal/CLI, REST API, or MCP—no code changes required. The system is built for pluggable LLM services, multi-provider support, and flexible credential management for both classic and MCP modes. This enables seamless switching or addition of LLM providers by any developer or operator.
* **Benefits:**
    - Enables scientific comparison and A/B testing of orchestration strategies.
    - Ensures robust fallback and zero downtime migration.
    - Provides analytics to guide future optimization and migration to MCP.
    - Centralizes LLM-driven tool selection logic in a maintainable service.
* **Documentation:**
    - Document conventions for classic mode (static registry, direct calls), MCP mode (protocol-based), both mode (parallel execution, logging), and AnalysisService as the entry point for LLM-driven tool selection.
    - Ensure all developers understand the config flag, orchestrator interface, and AnalysisService responsibilities.


1.  ### Project Setup & Foundation (Fastify)
    *   **Implementation:** Initialize TypeScript project, `npm install fastify`. Setup `tsconfig.json`, Linter (ESLint), Formatter (Prettier). Setup basic `Dockerfile`. Initialize Git. Create `src/app.ts` for Fastify instance creation and basic plugin registration, and `src/server.ts` to start the server.
    *   **Logging:** Initial console logging.

2.  ### Logging & Configuration Setup (Fastify)
    *   **Implementation:** Use `fastify-env` or similar for typed environment variable configuration (`src/config/`). Integrate `pino` for logging (Fastify has excellent built-in Pino support, often via `fastify.log`). Configure Pino options (level, pretty print dev, JSON prod).
    *   **Logging:** Log application start, bound address/port, critical config values (mask secrets). Ensure request IDs are logged (Fastify default).

3.  ### Define Core Domain Models & Interfaces
    *   **Implementation:** Define TypeScript interfaces/classes for `Build`, `Run`, `UniversalConfigurationPackageFormat` (v1), `Tool` base types in `src/core/domain/`. Define repository interfaces (`IBuildRepository`, `IRunRepository`), Queue producer interface (`IQueueProducer`), and basic `IToolbox` interface in `src/core/interfaces/`.
    *   **Logging:** N/A.

4.  ### Database Plugin & Basic Repositories
    *   **Implementation:** Setup DB client (e.g., Prisma). Create a Fastify plugin (`src/plugins/db.plugin.ts`) to manage DB connection lifecycle and decorate the Fastify instance (`fastify.db`). Implement basic repositories in `src/infrastructure/db/` using the plugin's decorated instance. Define initial schemas.
    *   **Logging:** Log DB connection via plugin (INFO/ERROR). Log repository calls (DEBUG) with IDs. Log DB errors (ERROR).

5.  ### Authentication Plugin
    *   **Implementation:** Create a Fastify plugin (`src/plugins/auth.plugin.ts`) using `fastify.addHook('onRequest', ...)` or `'preHandler'` to check for an API key from headers against config. Decorate `request` with `userId` on success, throw Unauthorized error on failure.
    *   **Logging:** Log auth success (INFO), failure (WARN) including request ID. *Do not log the key*.

6.  ### Asynchronous Task Queue Plugin & Producer
    *   **Implementation:** Integrate queue system (e.g., BullMQ). Create a Fastify plugin (`src/plugins/queue.plugin.ts`) to setup queue connections and clients. Implement `QueueProducer` (`src/infrastructure/queue/`) using the client, fulfilling the `IQueueProducer` interface. Inject producer into services where needed (DI).
    *   **Logging:** Log queue connection via plugin. Log job additions (INFO) with job IDs/data.

7.  ### Implement Modular Interactive Scrape Controllers
    *   **Implementation:** Create a modular architecture for the scraping workflow by breaking down the monolithic controller into specialized controllers for each step of the process: `CreateScrapeController`, `StatusController`, `ProposalFeedbackController`, `SampleFeedbackController`, and `ResultsController`.

## 5.1 Command-Line Tool (CLI)

1. **Architecture:** Node.js CLI application using commander.js, supporting a command hierarchy.  
2. **Configuration Management:** Local config file (.thebrainrc) for endpoint URL, API key, default formats.  
3. **Core Commands:**
   * `brain scrape create "<objective>" [--urls=<url1,url2,...>] [--orchestration-mode=<mode>]` - Start an interactive scraping job
   * `brain scrape status <job_id>` - Check status of a scraping job
   * `brain scrape feedback:proposal <job_id> [--approve/--reject] [options]` - Submit feedback on a proposal
   * `brain scrape feedback:sample <job_id> [--approve/--reject] [options]` - Submit feedback on sample results
   * `brain scrape results <job_id> [--format=json/csv]` - Get final scraping results
   * `brain builds [id]` - Manage/view builds
   * `brain runs [id]` - Manage/view runs
   * `brain config` - Manage configuration

### 5.1.1 MCP-Oriented CLI Integration

1. **Orchestration Mode Support:**
   * CLI provides explicit control over the orchestration mode via the `--orchestration-mode` flag (values: classic, mcp, dual).
   * When creating a scrape job, this option is passed to the backend to control which tool orchestration approach is used.
   * Default mode is determined by the server-side `TOOL_ORCHESTRATION_MODE` configuration.

2. **MCP Tool Selection Visibility:**
   * Status command enhanced to show detailed information about MCP tool selection process.
   * Displays which tool was selected and the reasoning behind the selection.
   * In dual mode, shows comparative metrics between classic and MCP implementations.

3. **Enhanced Authentication:**
   * All CLI commands use API key authentication from config file.
   * Implementation maintains proper security by storing keys in user's home directory.
   * Support for different authentication methods (API key, OAuth) depending on deployment environment.

4. **Rich Terminal Interface:**
   * Interactive progress displays for long-running operations.
   * Color-coded output to distinguish between different types of information.
   * Support for both human-readable and machine-parseable output formats.

5. **MCP Tool Performance Metrics:**
   * When operating in dual mode, CLI displays performance comparisons between classic and MCP implementations.
   * Metrics include accuracy, execution time, error rates, and resource usage.
   * Historical performance data to track improvements over time.

## 5.2 Backend Implementation

8.  ### Implement Basic LLM Analysis Job (`build.processor.ts`)
    *   **Implementation:** Create `src/jobs/build.processor.ts`. Define worker logic for `build-queue` jobs. Fetch build context. Call (mocked/simple) `LlmService` to get initial package (Universal Format v1). Update build status. Store temporary package. Trigger basic sample generation logic within this job or call a dedicated service.
    *   **Logging:** Log job processing start/success/failure (INFO/ERROR) with `jobId`, `buildId`. Log LLM interaction (DEBUG). Log generated package (DEBUG). Log status changes (INFO). Log errors (ERROR). Include `buildId`.

9.  ### Implement Basic Execution Framework & Initial Tool (Toolbox v0.1)
    *   **Implementation:** Create initial `Toolbox` registry (`src/infrastructure/toolbox/`) and `ExecutionEngine` service. Implement one basic "tool" (e.g., Fetch/Cheerio, see Section 5). Engine logic: load tool from package, run on sample URLs, capture results/errors. Called by `BuildProcessor`.
    *   **Logging:** Log tool execution start/end per URL (INFO). Log success/failure (INFO/WARN). Include `buildId`.

10. ### Implement `runs` Module Routes (`POST /runs`, `GET /runs/{id}`, `GET /runs/{id}/results`)
    *   **Implementation:** Create `src/modules/runs/` similar to `builds`. `RunService` methods:
        *   `createRun`: Validate `buildId` (confirmed), create `Run` record, retrieve `final_configuration`, call `queueProducer.addRunJob()`, return `202`.
        *   `getRunStatus`: Fetch run, return status. Handle 404.
        *   `getRunResults`: Fetch run, validate `completed`, return results. Handle 404/state errors.
    *   **Logging:** Similar logging pattern as `builds` module, using `runId`.

11. ### Implement Basic Run Execution Job (`run.processor.ts`)
    *   **Implementation:** Create `src/jobs/run.processor.ts` for `run-queue`. Use the *same* `ExecutionEngine`. Iterate through `target_urls`, execute the `final_configuration` package. Aggregate/store results. Update `Run` status to `completed` or `failed`.
    *   **Logging:** Log job start/end (INFO) with `jobId`, `runId`. Log progress periodically (INFO). Log individual URL outcome (DEBUG/WARN). Log final status (INFO/ERROR).

12. ### Basic Error Handling
    *   **Implementation:** Setup Fastify error handling hook (`setErrorHandler`). Ensure failed build/run jobs update status and store a basic error message. `GET` endpoints return this message.
    *   **Logging:** Global error handler logs uncaught exceptions (FATAL/ERROR). Ensure job failures log specific reasons (ERROR).

### Phase P1: Refinement, Robustness & Usability (Fastify)

**Goal:** Implement feedback loop, tool switching, cancellation, progress, tool discovery using Fastify patterns. Implement core toolbox tools.

**Tasks:**

1.  ### Implement `POST /builds/{id}/configure` Route
    *   **Implementation:** Add route to `build.routes.ts` with schema validation. Enhance `BuildService` to handle refinement requests: validate state, trigger a *refinement* type job via `queueProducer`, update status to `processing_feedback`.
    *   **Logging:** Log refinement request (INFO). Log validation failure (WARN). Log refinement job queuing (INFO). Include `userId`, `buildId`.

2.  ### Implement LLM Package Refinement Job Logic
    *   **Implementation:** Enhance `RefinementProcessor` to handle refinement jobs based on user feedback. Implement feedback processing for both proposal and sample stages. Add logic to determine when tool switching is needed. Support translating configuration between different tool formats. Create new package and trigger appropriate next steps based on the refinement outcome.
    *   **Logging:** Log refinement job start/end (INFO). Log user feedback and context (DEBUG). Log prompt/response (DEBUG). Log new package (DEBUG). Log status updates (INFO). Log errors (ERROR). Include `buildId`.
    *   **Terminal Interface:** Implement terminal commands for submitting proposal feedback (`scrape:feedback:proposal <job_id> --approve/--reject [options]`) and sample feedback (`scrape:feedback:sample <job_id> --approve/--reject [options]`).

3.  ### Implement Core Toolbox Tools (See Section 3)
    *   **Implementation:** Build the initial set of tools (Fetch/Cheerio, Playwright, Basic Proxy, User-Agent Rotator) within `src/infrastructure/toolbox/`, ensuring they adhere to the `ITool` interface. Update `Toolbox` registry.
    *   **Logging:** Log tool initialization (DEBUG). Log specific warnings/errors within tools (WARN/ERROR).

4.  ### Enhance Execution Framework for Tool Switching
    *   **Implementation:** Ensure `ExecutionEngine` robustly loads and executes *any* registered tool based on the `toolId` in the configuration package. Test switching between Fetch/Cheerio and Playwright tools.
    *   **Logging:** Log which `toolId` is being executed (INFO) for primary/auxiliary tools.

5.  ### Implement Run Cancellation Route (`POST /runs/{id}/cancel`)
    *   **Implementation:** Add route to `run.routes.ts`. `RunService` validates state (`running`), signals cancellation (e.g., DB flag, Redis). `RunProcessor` checks flag, stops gracefully, updates status to `canceled`. Route returns `202`.
    *   **Logging:** Log cancel request (INFO). Log signal sent (INFO). Log processor detecting cancel (INFO). Log final `canceled` status update (INFO). Include `userId`, `runId`.

6.  ### Implement Run Progress Reporting
    *   **Implementation:** Enhance `RunProcessor` to update progress metrics on `Run` record. Enhance `GET /runs/{id}` status route in `run.routes.ts` / `RunService` to return these metrics.
    *   **Logging:** Log progress updates (DEBUG/INFO) in processor.

7.  ### Implement Tool Discovery Module (`GET /tools`)
    *   **Implementation:** Create `src/modules/tools/` with `tools.routes.ts` and `ToolService`. Service reads from `Toolbox` registry (or config) and returns the list.
    *   **Logging:** Log request received (INFO).

8.  ### Improve Error Detail & Handling
    *   **Implementation:** Refine `setErrorHandler`. Ensure processors capture detailed errors from tools/LLM and store them appropriately. Differentiate transient vs fatal errors.

9.  ### Partial Results for Failed Runs (Policy & Implementation)
    *   **Implementation:** Decide policy. If allowing, modify `RunProcessor` to save partial results even on failure, and update `GET /runs/{id}/results` to return them for `failed` state.
    *   **Logging:** Log decision (INFO).

### Phase P2: Learning & Advanced Features (Fastify)

**Goal:** Implement Knowledge Base, manual override, result pagination, optional sanity check.

**Tasks:**

1.  ### Knowledge Base Storage & Service
    *   **Implementation:** Design KB schema. Integrate Vector DB client if needed (maybe via Fastify plugin). Create `KnowledgeBaseService` (`src/core/services` or own module). Implement save/query methods.
    *   **Logging:** Log KB interactions (INFO/DEBUG/ERROR).

2.  ### Integrate KB Saving (Post-Confirmation)
    *   **Implementation:** Enhance `confirmBuild` flow in `BuildService` (or trigger async job) to call `KnowledgeBaseService.saveLearnedPackage()`. Extract/derive necessary metadata. Handle errors gracefully.
    *   **Logging:** Log KB save attempt/success/failure (INFO/ERROR) related to `buildId`.

3.  ### Integrate KB Retrieval (Pre-LLM Analysis)
    *   **Implementation:** Enhance `LlmService`. Before calling LLM (initial or refinement), call `KnowledgeBaseService.findRelevantPackages()`.
    *   **Logging:** Log KB query (INFO). Log results found/used (INFO).

4.  ### Integrate KB Results into LLM Prompts/Logic
    *   **Implementation:** Modify LLM prompts/logic in `LlmService` to include KB examples. Implement *fast path* logic (bypass LLM if high-confidence match found).
    *   **Logging:** Log KB context inclusion (DEBUG). Log fast path activation (INFO).

5.  ### Implement Manual Build Route (`POST /builds/manual`)
    *   **Implementation:** Add route to `build.routes.ts`. `BuildService` method validates input package (schema/tool check), creates build, triggers sample generation directly.
    *   **Logging:** Log manual build request (INFO). Log validation result (INFO/WARN). Include `userId`.

6.  ### Implement Result Pagination
    *   **Implementation:** Update `GET /runs/{id}/results` route and `RunService.getRunResults` to handle pagination parameters (use schemas for validation). Update DB query/result retrieval logic.
    *   **Logging:** Log pagination params used (DEBUG).

7.  ### Implement Configuration Package Sanity Check (Optional Enhancement)
    *   **Implementation:** Create validation service/function. Call it from `BuildProcessor` after LLM refinement generates a new package. Fail job early if invalid.
    *   **Logging:** Log sanity check start/pass/fail (INFO/INFO/WARN) with `buildId`.

### Phase P3: Optimization, Monitoring & Polish (Fastify)

**Goal:** Focus on performance, scalability, observability, security using Fastify ecosystem where applicable.

**Tasks:**

1.  ### Performance Optimization (Fastify)
    *   **Implementation:** Profile endpoints/jobs. Use Fastify's async nature effectively. Optimize DB queries. Cache results/KB queries (e.g., using `fastify-redis`). Tune worker concurrency.
    *   **Logging:** Use DEBUG logs for profiling. Log cache hits/misses (DEBUG).

2.  ### Advanced Monitoring & Alerting
    *   **Implementation:** Integrate Prometheus metrics (`fastify-metrics` or similar). Track request duration, error rates, queue stats, job times, LLM latency. Setup Grafana dashboards and Alertmanager alerts.
    *   **Logging:** Ensure structured logs facilitate monitoring.

3.  ### Advanced Retry Logic (Queues)
    *   **Implementation:** Configure job retry options in the queue system (e.g., BullMQ backoff strategies). Handle dead-letter queues.
    *   **Logging:** Log retry attempts (WARN). Log jobs moved to dead-letter queue (ERROR).

4.  ### Security Hardening (Fastify)
    *   **Implementation:** Use `fastify-helmet` for security headers. Implement rate limiting (`fastify-rate-limit`). Validate/sanitize all inputs, especially LLM prompts. Review dependencies (`npm audit`). Secure API key handling.
    *   **Logging:** Log rate limit events (WARN). Log potential security events (WARN/ERROR).

5.  ### API Documentation (Fastify)
    *   **Implementation:** Use `fastify-swagger` to automatically generate OpenAPI documentation from route schemas and definitions. Ensure descriptions are clear. Document Universal Format and tools in README/external docs.
    *   **Logging:** N/A.

6.  ### Knowledge Base Maintenance Considerations
    *   **Implementation:** Design strategies for KB aging/validation (TTL, usage counters, re-validation jobs).
    *   **Logging:** Log KB entry usage frequency/age during retrieval (DEBUG).

## 3. Initial Toolbox Implementation (Enhanced for Difficult Sites - Core P0/P1 Requirement)

The `Modular Tool Integration & Execution Framework` needs a capable initial set of tools to handle complex, heavily protected websites like social media platforms, job boards, and e-commerce sites. These implementations focus on open-source libraries and common techniques. Tools reside in `src/infrastructure/toolbox/` and adhere to the `ITool` interface.

### Common Tool Interface (`ITool`)

```typescript
// src/core/interfaces/toolbox.interface.ts (Remains the same)
interface IToolRunParams {
  url: string;
  // Core parameters derived from the config package by the Execution Engine
  proxyConfig?: { protocol: string; host: string; port: number; username?: string; password?: string };
  headers?: Record<string, string>;
  [key: string]: any;
}

interface IToolRunResult {
  success: boolean;
  data?: any | null;       // Structured data if successful
  error?: string | null;    // Error message if failed
  statusCode?: number;      // HTTP status code if applicable
  finalUrl?: string;        // URL after redirects
  screenshotData?: string; // Base64 encoded screenshot on failure/request
  htmlContent?: string;     // Raw HTML content on failure/request
}

interface ITool {
  toolId: string;
  toolType: 'scraper' | 'proxy' | 'anti-blocking' | 'captcha';

  initialize(config: Record<string, any>): Promise<void>;
  run(params: IToolRunParams, packageConfig: Record<string, any>): Promise<IToolRunResult>;
  cleanup?(): Promise<void>;
}

interface IToolbox {
  // ... same as before
  registerTool(tool: ITool): void;
  getTool(toolId: string): ITool | undefined;
  getAvailableTools(): Array<{ toolId: string; toolName: string; toolType: string; description: string; /* P2: configSchemaUrl? */ }>;
}
```

### Initial Tool Implementations (P0/P1 Focus)

#### Scraper Tools

1.  **`scraper:static_v1`** (Formerly `fetch_cheerio_v1`)
    *   **Purpose:** Handles basic static HTML websites or API endpoints. Efficient for simple targets.
    *   **Implementation:** Use `axios` with robust configuration (timeouts, retries on network errors, header handling, proxy support via `https-proxy-agent`). Use `cheerio` for server-side DOM parsing and data extraction.
    *   **Processor Integration:** Used by the `ExecutionProcessor` and `SampleGenerationProcessor` for static content scraping. Can be selected automatically by the `BuildAnalysisProcessor` or switched to by the `RefinementProcessor` based on user feedback.
    *   **Config Params:** `selectors: { [fieldName: string]: string | { selector: string, attribute?: string, type?: 'text'|'html'|'number' } }`, `targetUrlPattern?` (regex to validate URL), `method?: 'GET' | 'POST'`, `body?: any`, `responseType?: 'json' | 'html'`.
    *   **Interface Adherence:** Implement `initialize`, `run`. `cleanup` likely no-op.
    *   **Dependencies:** `axios`, `cheerio`, `https-proxy-agent`.
    *   **Priority:** P0/P1 (Foundation, but limited for target sites).
    *   **Scraping Difficult Sites:** Generally **insufficient** for dynamic, heavily protected sites. Useful for initial page load checks or potentially hitting known API endpoints found via other means.

2.  **`scraper:playwright_stealth_v1`** (Enhanced Playwright)
    *   **Purpose:** The primary tool for dynamic (JavaScript-heavy) websites, capable of user interactions and incorporating stealth techniques.
    *   **Implementation:** Use **`playwright-extra`** with the **`puppeteer-extra-plugin-stealth`** plugin. This automatically attempts to patch common detection vectors (WebDriver flags, User-Agent inconsistencies, Chrome runtime flags, permissions checks, etc.). Configure Playwright's browser contexts for proxy usage, custom headers, viewport, timezone, locale. Implement logic for specified interactions (clicks, waits, scrolls, typing) and data extraction using Playwright selectors or `page.evaluate()`. **Crucially, incorporate network interception (`page.route`, `page.waitForResponse`)** to capture data loaded via background XHR/fetch requests, which is vital for sites like Facebook, LinkedIn, TikTok, etc.
    *   **Config Params:**
        *   `browserType: 'chromium' | 'firefox' | 'webkit'`
        *   `headless: 'new' | true | false` (Use 'new' headless mode)
        *   `launchOptions?: Record<string, any>` (e.g., args for sandbox, specific executable path)
        *   `contextOptions?: Record<string, any>` (e.g., `viewport`, `locale`, `timezoneId`, `geolocation`, `permissions`)
        *   `interactions?: Array<{ action: 'goto'|'click'|'wait'|'type'|'scroll'|'waitForSelector'|'waitForNetworkIdle'|'evaluate', ...params }>`
        *   `interceptRequests?: Array<{ urlPattern: string, action: 'capture' | 'block' }>` (To listen for API calls)
        *   `extractionSelectors: { [fieldName: string]: string | { selector: string, attribute?: string, type?: 'text'|'html'|'number' } }` (Executed after interactions)
        *   `extractionScript?: string` (JS code snippet for `page.evaluate`)
        *   `screenshotOnError?: boolean`, `saveHtmlOnError?: boolean`
    *   **Interface Adherence:** Implement `initialize` (browser launch/pooling), `run` (context creation, navigation, interaction, extraction), `cleanup` (context/browser closing).
    *   **Dependencies:** `playwright-extra`, `puppeteer-extra-plugin-stealth` (yes, the puppeteer plugin often works with playwright-extra), `playwright`.
    *   **Priority:** P1 (Essential).
    *   **Scraping Difficult Sites:** **Required.** Handles JS execution, interactions, basic fingerprint evasion via stealth plugin, and network interception for API data. This is the workhorse.

3.  **`scraper:puppeteer_stealth_v1`** (Alternative to Playwright)
    *   **Purpose:** Similar to Playwright, offering browser automation with stealth capabilities. Some prefer its API or find it behaves differently on certain sites.
    *   **Implementation:** Use **`puppeteer-extra`** with **`puppeteer-extra-plugin-stealth`**. Implementation details mirror `scraper:playwright_stealth_v1` regarding context options, interactions, network interception, and stealth plugin usage.
    *   **Config Params:** Largely identical to `playwright_stealth_v1`, potentially minor differences in launch/context options names based on Puppeteer's API.
    *   **Interface Adherence:** Implement `initialize`, `run`, `cleanup`.
    *   **Dependencies:** `puppeteer-extra`, `puppeteer-extra-plugin-stealth`, `puppeteer`.
    *   **Priority:** P1 (Provides choice/fallback).
    *   **Scraping Difficult Sites:** **Required.** Offers similar capabilities to the Playwright version.

#### Proxy Tools

4.  **`proxy:manager_rotating_v1`** (Enhanced Proxy Handling)
    *   **Purpose:** Manages a pool of proxy IPs and provides rotation logic to avoid IP-based blocking. Essential for scraping at scale or hitting sensitive sites.
    *   **Implementation:** This tool's primary role is to provide valid proxy connection details (`proxyConfig`) to the **scraper** tools upon request.
        *   **Simple Mode:** Rotate through a list of proxies provided directly in the config (`proxies: ["http://user:pass@host:port", ...]`). Simple round-robin or random selection.
        *   **Provider Integration Mode (P2/P3 advanced):** Potentially integrate directly with APIs of proxy providers (e.g., Bright Data, Oxylabs, Smartproxy) to fetch/rotate IPs, manage sessions, target specific geos. This is complex.
        *   The `ExecutionEngine` retrieves proxy details from this tool (if present in the package) and passes them to the scraper's `run` method `params`.
    *   **Config Params:**
        *   `mode: 'list' | 'provider_api'`
        *   `proxies?: Array<string>` (Full proxy URLs for 'list' mode)
        *   `rotationStrategy?: 'round-robin' | 'random'` ('list' mode)
        *   `providerDetails?: { name: string, apiKey: string, options?: any }` ('provider_api' mode)
        *   `geoTargeting?: string[]` (e.g., ['US'], ['GB', 'DE'])
        *   `sessionDuration?: number` (seconds, if provider supports sticky sessions)
    *   **Interface Adherence:** May not need the full `ITool` interface (especially `run`). Could be a helper class invoked by the `ExecutionEngine` or a simpler interface focused on `getProxyConfig()`. `initialize` could setup connections or validate the list.
    *   **Dependencies:** Optional: SDKs for specific proxy providers. `https-proxy-agent` might be needed internally if testing proxies.
    *   **Priority:** P1 (Essential for target sites).
    *   **Scraping Difficult Sites:** **Required.** IP rotation is fundamental to bypass throttling and bans on sites like Google Maps, LinkedIn, Indeed, etc. Residential or mobile proxies (obtained via providers) are often necessary.

#### Anti-Blocking Tools (Helpers configured by Execution Engine)

5.  **`antiblock:ua_realistic_v1`** (Enhanced User-Agent)
    *   **Purpose:** Provides realistic, diverse, and up-to-date User-Agent strings matching browser profiles.
    *   **Implementation:** Use a library like **`user-agents`**. The tool provides a method like `getRealisticUserAgent({ browserType?: 'chrome'|'firefox', deviceType?: 'desktop'|'mobile' })`. The `ExecutionEngine` calls this and sets the appropriate header for the scraper.
    *   **Config Params:** `enabled: boolean`, `deviceType?: 'desktop' | 'mobile'`, `browserFamilies?: ('chrome'|'firefox'|'safari'|'edge')[]`.
    *   **Interface Adherence:** Helper module/class, not a full `ITool`.
    *   **Dependencies:** `user-agents`.
    *   **Priority:** P1 (Essential).
    *   **Scraping Difficult Sites:** Helps avoid basic UA signature blocking. Must be consistent with other fingerprinting aspects (headers, JS properties).

6.  **`antiblock:headers_realistic_v1`** (Enhanced Headers)
    *   **Purpose:** Generates a set of realistic HTTP headers (Accept, Accept-Language, Sec-CH-UA, etc.) consistent with a chosen browser/UA profile.
    *   **Implementation:** Maintain profiles of typical headers associated with common browser versions (e.g., latest Chrome desktop). Can dynamically generate Sec-CH-UA headers based on the chosen User-Agent. The `ExecutionEngine` retrieves these headers and merges them with any user-defined headers before passing them to the scraper.
    *   **Config Params:** `enabled: boolean`, `profilePreset?: 'latest_chrome_desktop' | 'latest_firefox_desktop' | 'latest_safari_mobile'`.
    *   **Interface Adherence:** Helper module/class.
    *   **Dependencies:** None directly, relies on internal logic/profiles.
    *   **Priority:** P1 (Essential).
    *   **Scraping Difficult Sites:** Critical for passing header consistency checks performed by anti-bot systems.

7.  **`antiblock:fingerprint_v1`** (Targeted Fingerprint Spoofing)
    *   **Purpose:** Allows configuring specific browser fingerprint attributes beyond basic stealth (screen size, WebGL vendor, canvas noise, etc.).
    *   **Implementation:** This configuration block is primarily interpreted by the `ExecutionEngine` and used to set specific **launch/context options** for Playwright/Puppeteer (using the `stealth` versions). It might involve passing arguments, setting viewport sizes, or potentially injecting JS via `page.evaluateOnNewDocument` to override specific `navigator` properties *before* the target page loads. `puppeteer-extra-plugin-anonymize-ua` or `playwright-extra` might offer relevant functionalities to leverage.
    *   **Config Params:** `enabled: boolean`, `screen?: { width: number, height: number }`, `webglVendor?: string`, `webglRenderer?: string`, `canvasNoise?: boolean`, `overrideNavigator?: { [key: string]: any }`.
    *   **Interface Adherence:** Configuration block interpreted by `ExecutionEngine` and applied to scraper tools.
    *   **Dependencies:** Relies on configurations within `playwright-extra`/`puppeteer-extra`.
    *   **Priority:** P1/P2 (Adds robustness beyond basic stealth, might be overkill initially but needed for toughest sites).
    *   **Scraping Difficult Sites:** Addresses more advanced fingerprinting detections (screen resolution, WebGL info, subtle JS property differences).

#### CAPTCHA Solving Tools

8.  **`captcha:solver_2captcha_v1`** (Example CAPTCHA Service Integration)
    *   **Purpose:** Integrates with an external CAPTCHA solving service (like 2Captcha) to handle challenges encountered during scraping.
    *   **Implementation:** This requires coordination:
        1.  The **scraper** tool (Playwright/Puppeteer) detects a CAPTCHA (e.g., specific selectors, iframe presence, URL change).
        2.  It extracts necessary data (site key, challenge URL/image/parameters).
        3.  It calls this `captcha:solver` tool's `solve()` method.
        4.  This tool sends the data to the external service API (e.g., 2Captcha).
        5.  It polls the service API for the solution token.
        6.  It returns the token to the scraper tool.
        7.  The scraper tool injects the token (e.g., into a hidden textarea) and submits the form.
    *   **Config Params:** `enabled: boolean`, `provider: '2captcha' /* | 'anti-captcha' | 'capmonster' | 'capsolver' */`, `apiKey: string`, `pollingInterval?: number`, `timeout?: number`.
    *   **Interface Adherence:** Likely needs a specific interface like `ICaptchaSolver { solve(params: { type: string, siteKey: string, pageUrl: string, ... }): Promise<{ success: boolean, solution?: string, error?: string }> }`. The `run` method of `ITool` might not fit directly. `initialize` could validate the API key.
    *   **Dependencies:** `axios` (for calling external API). Potentially provider-specific SDKs.
    *   **Priority:** P1 (Essential for many target sites like Google, Indeed, sometimes social media).
    *   **Scraping Difficult Sites:** **Required** whenever CAPTCHAs are encountered. LLM needs to configure the scraper to detect CAPTCHAs and invoke this solver tool.

**Execution Engine Orchestration:**

The `ExecutionEngine` is critical. It must:
*   Parse the `UniversalConfigurationPackage`.
*   Initialize the selected primary scraper (`scraper:playwright_stealth_v1` etc.).
*   Initialize helper tools/retrieve configurations (`proxy:manager_rotating_v1`, `antiblock:ua_realistic_v1`, `antiblock:headers_realistic_v1`, `antiblock:fingerprint_v1`).
*   Generate the final `headers`, `proxyConfig`, and specific context/launch options based on the anti-blocking configurations.
*   Pass these consolidated parameters to the scraper's `run` method.
*   Potentially coordinate CAPTCHA solving if configured (the scraper might need a reference to the solver tool).

This enhanced toolbox provides a much stronger foundation for tackling the challenges posed by modern, well-protected websites, leveraging key open-source libraries and techniques.

## 4. Logging Strategy (Fastify Context)

*   **Standard Levels:** ERROR, WARN, INFO, DEBUG (as defined before). Use `fastify.log[level](...)`.
*   **Structured Logging:** Leverage Fastify's built-in Pino integration for automatic JSON logging.
*   **Context is Key:** Fastify automatically adds `reqId`. Ensure controllers/services pass relevant context (`buildId`, `runId`, `userId` decorated on `request` by auth plugin) down to subsequent calls and include it in log objects: `fastify.log.info({ buildId, userId }, "Build created successfully")`. Background jobs need context passed explicitly and logged similarly: `logger.info({ jobId, buildId }, "Processing build job")`.
*   **Security:** **NEVER** log sensitive info.

## 5. Key Considerations

*   **Fastify Ecosystem:** Leverage Fastify's plugin architecture for modularity (auth, db, queue, swagger, metrics). Utilize its schema-based validation and serialization for performance and safety. Understand its request lifecycle and hooks.
*   **LLM Integration & Cost:** As before - latency, cost, prompt engineering, error handling.
*   **Modularity & Extensibility:** Universal Configuration Package Format and `ITool`/`IToolbox` interfaces are critical. Adding tools requires creating a new class/module implementing `ITool` and registering it.
*   **Scalability & Performance (Node.js/Fastify):** Fastify is highly performant. Focus shifts to non-blocking I/O, efficient async operations, worker thread usage for CPU-bound tasks (less common here), database/external service bottlenecks, and scaling worker instances for queues.
*   **Error Handling & Resilience (Fastify):** Use Fastify's `setErrorHandler` for centralized API error responses. Implement robust error handling within tools, job processors, and services. Plan for retries.
*   **Security:** Leverage Fastify security plugins (Helmet, CSRF if needed, Rate Limiting). Perform rigorous input validation (schemas help). Sanitize LLM inputs.
*   **State Management:** Accurate state tracking across async jobs and API calls remains critical. Use DB transactions where necessary for atomicity.



## Database: PostgreSQL (formerly SQLite)

- The Brain App now uses **PostgreSQL** as its primary database for all environments.
- Prisma ORM is configured for PostgreSQL (see `prisma/schema.prisma`).
- JSON data is stored using Postgres `jsonb` columns for flexibility and performance.

**Containerization & Orchestration**
- Use Podman or Docker Compose to run both the app and PostgreSQL locally or in CI.
- See `docker-compose.yml` for service definitions.

**Prisma & Migrations**
- Run migrations inside the app container:
  ```sh
  podman-compose exec app npx prisma migrate deploy
  podman-compose exec app npx prisma generate
  ```
- See `.env` for the correct `DATABASE_URL` format.

**Future: Vector Database Support**
- PostgreSQL can be extended with the `pgvector` extension for AI/semantic search.
- Plan to add vector columns and similarity search for knowledge base and LLM integration.

**Removal of SQLite**
- All SQLite files and references have been removed for full container compatibility.

Refer to `Podman_Container_README.md` for detailed container setup instructions.