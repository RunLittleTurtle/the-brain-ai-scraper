<!--
This document is the single source of truth for the LLM coding assistant. The LLM should reference, update, and maintain this doc as the project evolves. All architectural, design, and implementation decisions should be reflected here.
-->

# LLM Assistant - Directives & Workflow (Project The Brain)

**YOU MUST FOLLOW THESE INSTRUCTIONS AT ALL TIMES.**

## 1. Core Context (ALWAYS Reference):

- **Tech Stack:** TypeScript, Node.js, Fastify (API), Prisma (ORM), Podman (for services during dev), **MCP (Model Context Protocol)**. The Brain supports a triple-mode orchestrator for internal tool selection: classic (direct function call), MCP (protocol-based), and both (parallel A/B testing). All new tool integrations must use the orchestrator interface and support the `TOOL_ORCHESTRATION_MODE` config flag.
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

## 5. Testing Protocol:

- Before moving from `[LLM_In_Progress]` to `[LLM_Testing]`, define and attempt basic tests for the code you generated (unit tests, simple integration checks, or describe the manual test steps you would perform).
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

## 8. Always use extensionless imports for local TypeScript files in this project.
**TypeScript Import Paths:**
- For all local imports, use extensionless paths (e.g., `import { X } from './foo'`) in `.ts` files.
- Do **not** use `.js` or `.ts` extensions unless the project is migrated to ESM and requires `.js` at runtime.
- This ensures compatibility with TypeScript's module resolution and avoids recurring import errors.