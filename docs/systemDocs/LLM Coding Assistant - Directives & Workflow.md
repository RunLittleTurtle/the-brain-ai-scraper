<!--
This document is the single source of truth for the LLM coding assistant. The LLM should reference, update, and maintain this doc as the project evolves. All architectural, design, and implementation decisions should be reflected here.
-->

# LLM Assistant - Directives & Workflow (Project The Brain)

**YOU MUST FOLLOW THESE INSTRUCTIONS AT ALL TIMES.**

## 1. Core Context (ALWAYS Reference):

### Complete Technology Stack

- **Language:** TypeScript 5.8+ with strict typing and ES Module support
- **Runtime:** Node.js (version 18+) with `"type": "module"` in package.json
- **API Framework:** Fastify 5.x with TypeBox for schema validation
- **Database:** PostgreSQL (containerized via Podman)
- **ORM:** Prisma 6.x for type-safe database access and schema management
- **Development Environment:** Podman for containerized services (database, test infrastructure)
- **Testing:** Vitest with custom utilities for database testing and mocking
- **Integration:** **MCP (Model Context Protocol)** for standardized LLM tool orchestration

### Core Architecture

The Brain supports a triple-mode orchestrator for internal tool selection:
- **Classic Mode:** Direct function calls to tools (traditional approach)
- **MCP Mode:** Protocol-based orchestration using the Model Context Protocol
- **Dual Mode:** Parallel A/B testing of both approaches with result comparison

All new tool integrations **must** use the orchestrator interface and support the `TOOL_ORCHESTRATION_MODE` config flag.
- **Feature Checklist/Tracker:** the-brain-ai-scraper/Docs/Feature Checklist.md - This defines priorities (P0 > P1 > P2 > P3) and feature requirements.
- **Your Goal:** Implement features according to the checklist and **advance tasks to the `[LLM_Test_Complete]` status**.

## 2. Security First:

- **Secrets:** NEVER hardcode secrets (API keys, passwords). Write code that reads secrets ONLY from **environment variables**. If a value isn't known, use a clear placeholder like `process.env.EXPECTED_SECRET_NAME` and add a `// TODO: Configure SECRET environment variable: EXPECTED_SECRET_NAME` comment.
- **Input Validation:** Implement reasonable input validation for API endpoints and function arguments.
- **Dependency Audit:** Regularly run `npm audit` and keep all dependencies up to date. Address vulnerabilities promptly by upgrading or removing affected packages. Remove unused dependencies as part of regular maintenance.
- **Third-Party Package Review:** Before adding any third-party package or import (especially those with access to the filesystem, network, or that can execute code), review its security, maintenance status, and necessity. Avoid unnecessary or risky dependencies.

## 3. Code Quality:

- **Comments:** Add comments *within the code* to explain complex logic, algorithms, or important design decisions.
- **Clarity:** Aim for readable and maintainable code adhering to standard TypeScript practices.

## 4. Workflow & Status Management:

- **Task Limit Rule:** You may not have more than **5 tasks** with status `[LLM_In_Progress]` or `[LLM_Testing]` at the same time. If you reach this limit, do not open new tasks—focus on advancing existing tasks to `[Human_Review]` before starting more.
- **Task Selection:** Autonomously select the highest priority task (P0, then P1, etc.) from `[Backlog]` or `[To Do]` on the Feature Checklist.
- Status Updates (Your Responsibility):
  - `[Backlog]` -> `[To Do]` (When you decide to tackle it next)
  - `[To Do]` -> `[LLM_In_Progress]` (When you start active coding/generation)
  - `[LLM_In_Progress]` -> `[LLM_Testing]` (When you *finish* generating the code for the feature)
  - `[LLM_Testing]` -> `[LLM_In_Progress]` (If your self-tests *fail*. Fix the code.)
  - `[LLM_Testing]` -> `[LLM_Test_Complete]` (If your self-tests *pass*. **Notify the Human Operator** you are ready for review.)
  - `[LLM_Test_Complete]` -> `[Human_Review]` (You Must prepare indication or a Test for the Human, so the Human can test and acknowledges readiness)
- Status Updates (Human Operator ONLY):
  - `[Human_Review]` -> `[Done]` (Human confirms ALL criteria met)
  - `[Human_Review]` -> `[LLM_In_Progress]` (Human rejects; provides feedback. Remove `_Test_Complete` tag.)

## 5. Testing Protocol Vitest:

- Before moving from `[LLM_In_Progress]` to `[LLM_Testing]`, define and attempt basic tests using Vitest for the code you generated (unit tests, simple integration checks, or describe the manual test steps you would perform).
- Execute these tests.
- **Crucially:** Update the status based *only* on the test outcome (`[LLM_Test_Complete]` on pass, back to `[LLM_In_Progress]` on fail).

## 6. Definition of `[LLM_Test_Complete]` (Your target state before involving Human):

- All required code generated.
- Code implements the core feature described in the tracker.
- Secrets are handled via environment variables.
- Necessary comments are present.
- Your defined self-tests PASS.

## 7. Await Instructions:

- Once a task is `[LLM_Test_Complete]`, **clearly state this** to the Human Operator and wait for their review or further instructions. **Do NOT proceed to `[Done]` or pick a new task until the reviewed one is moved out of `[LLM_Test_Complete]` by the Human.**

## 8. TypeScript & ES Module Requirements (MANDATORY)

### Import Path Extensions

**Requirement:** Due to the project's ES Module configuration (`"type": "module"` in `package.json` and `"moduleResolution": "NodeNext"` in `tsconfig.json`), you **MUST** use explicit `.js` extensions for all relative imports between local TypeScript (`.ts`) files.

**Correct Examples:**
- `import { MyService } from './my.service.js';`
- `import { helper } from '../utils/helper.js';`
- `import { controller } from '../../modules/feature/feature.controller.js';`

**Incorrect Examples:**
- `import { MyService } from './my.service';` ❌
- `import { helper } from '../utils/helper';` ❌
- `import { controller } from '../../modules/feature/feature.controller';` ❌

**Reasoning:** This is required for Node.js to correctly resolve modules at runtime when using ES Modules. Failure to include the `.js` extension will result in build failures (`tsc`) and runtime errors (`Error [ERR_MODULE_NOT_FOUND]`).

### File Organization Conventions

- **Services:** Feature-specific services should be placed in their respective module directory with `.service.ts` naming
- **Controllers:** API route controllers should use `.controller.ts` naming
- **Repositories:** Database access layer components should use `.repository.ts` naming
- **Test Files:** Test files should be named with `.test.ts` suffix
- **Test Utilities:** Common test helpers should be placed in `tests/utils/` directory

**Do NOT use extensionless imports for local files under any circumstances.** The previous directive allowing this was incorrect for this project's configuration.