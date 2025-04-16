# Documentation: The Brain's Core Adaptive Loop & Configuration Engine (TypeScript Focused Terminology)

## 1. Introduction

The core differentiator of "The Brain" API lies in its ability to not just execute predefined scraping tasks, but to **intelligently build, refine, and adapt scraper configuration packages** based on natural language objectives and user feedback. This involves a complex interplay between Large Language Models (LLMs), a modular tool architecture, and a learning mechanism leveraging past successes. This document outlines the architecture, technical requirements, and key considerations for implementing this adaptive loop.

## 2. The Core Refinement Loop Explained

The iterative refinement process is central to the user experience after the initial build attempt. It enables users to guide The Brain towards the desired outcome when the first attempt isn't perfect.

**Flow:**

1. **User Feedback Submission:** The user reviews the initial `package_results` (samples) via `GET /builds/{build_id}`. If unsatisfactory, they submit feedback via `POST /builds/{build_id}/configure` containing `user_feedback` text (and optional `tool_hints`).

2. Context Aggregation:

    

   The backend gathers the necessary context for the LLM:

   - Original `user_objective` & target `URLs`.
   - The *previous* configuration package (Version N) that generated the reviewed samples.
   - The actual sample `package_results` (Version N).
   - The new `user_feedback`.

3. **(P2) Knowledge Base Query:** Before LLM analysis, the system queries the Knowledge Base (`Leverage Past Configuration Packages` feature) for successful configurations on similar platforms/objectives. Relevant findings are added to the LLM's context.

4. LLM Analysis & Refinement:

    

   The LLM analyzes the feedback

    

   in context

   . Its goal is to understand the discrepancy and determine how to modify the configuration package:

   - **Minor Adjustments:** Modify parameters within the *existing* tools (e.g., change selectors, adjust timeouts).
   - **Tool Switching:** If the feedback indicates a fundamental limitation of the current tool (e.g., needing JavaScript execution when using a simple DOM parser), the LLM selects a *different*, more appropriate tool from the available Toolbox based on its understanding of tool capabilities.
   - **Logic Change:** Modify the scraping logic or data mapping described within the configuration package.

5. **New Configuration Package Generation:** The LLM outputs a *new* temporary configuration package (Version N+1) in the **Universal Configuration Package Format**.

6. **(P2/P3) Configuration Package Sanity Check (Optional):** The newly generated package is validated against the Universal Package Format schema and checked for valid tool identifiers before proceeding. This catches basic LLM errors early. If it fails, the build status becomes `failed`.

7. **New Sample Generation:** The *new* configuration package (Version N+1) is executed against sample URLs via the `Initial Sample Generation` process.

8. **User Review:** New `package_results` (Version N+1) are generated and stored. The build status updates to `pending_user_feedback`. The user reviews the new samples via `GET /builds/{build_id}`, continuing the loop if needed or confirming via `POST /builds/{id}/confirm`.

## 3. Key Enabling Technologies & Concepts

- **Universal Configuration Package Format (P0):**
  - **Purpose:** The standardized definition describing a complete scraper package. It's the common language understood by the LLM, the Execution Framework, and the storage system.
  - **Content:** Must define: selected scraper tool + parameters, selected auxiliary tools (proxy, anti-block, captcha) + parameters, potentially expected output schema.
  - **Format:** Likely JSON Schema based for structure and validation, potentially mapped to TypeScript types/interfaces within the codebase.
  - **Requirement:** Must be expressive enough to configure *any* tool combination in the Toolbox.
- **Modular Tool Integration & Execution Framework (P0):**
  - **Purpose:** Allows plug-and-play addition/use of different scraping and auxiliary tools without core system changes.
  - Components:
    - **Toolbox:** A registry of available tools (TypeScript classes, modules, functions).
    - **Standard Interface:** Each tool must adhere to a defined interface (e.g., a TypeScript `interface` defining methods like `initialize(config)`, `run(url, parameters)`, `cleanup()`). Input includes relevant parts of the Universal Config Package; output is structured data or a standardized error object.
    - **Execution Engine:** Orchestrates loading the tools specified in a Universal Config Package, invoking them with URLs/parameters, managing retries (optional), and aggregating results/errors.
- **LLM's Role (P0 - Initial, P1 - Refinement):**
  - **Initial Build:** Interprets the `user_objective` and sample URLs to select initial tools and generate the first configuration package.
  - **Refinement:** Analyzes `user_feedback` *in context* (past attempts, KB results) to modify or completely regenerate the configuration package, potentially switching tools.
  - **Requires:** Sophisticated prompt engineering, access to tool descriptions/capabilities, and potentially fine-tuning for comprehending scraping-specific feedback.
- **Knowledge Base (P2):**
  - **Purpose:** Enables The Brain to learn from collective experience.
  - **Saving (`Save Successful Configuration Package`):** After user confirmation (`POST /builds/{id}/confirm`), the successful `final_configuration` (package), platform identifiers, output schema, and objective context are stored and indexed.
  - **Retrieval (`Leverage Past Configuration Packages`):** During the initial build *and* refinement steps, the LLM first queries this base for relevant prior example packages to inform its configuration strategy, potentially finding exact matches or useful starting points.
  - **Requires:** Suitable database (likely Vector DB for semantic search on objectives + Structured DB for metadata), efficient indexing and querying.

## 4. Tool "Mix-and-Match" Strategy

The Brain doesn't just pick *one* scraper; it assembles a *package* by combining tools.

- **Mechanism:** The **Universal Configuration Package Format** defines *which* tools are combined for a specific build.
- **Decision Maker:** The **LLM** decides the combination based on its analysis of the objective, target site complexity (inferred from sample URLs or KB), and user feedback.
- **Execution:** The **Modular Execution Framework** reads the Universal Config Package and invokes the specified combination of tools (e.g., "Use Playwright Scraper v3 WITH Smart Proxy Manager v2 AND Standard User-Agent Rotator v1").
- **Common Combinations:** Scraper (e.g., based on Cheerio, Playwright, etc.) + Proxy Management + User-Agent Rotation + CAPTCHA Solving (if needed). The LLM chooses the *specific implementation* (tool ID) of each required component type.

## 5. Configuration Package Sanity Check (Enhancement - P2/P3)

- **Rationale:** LLMs can sometimes generate syntactically incorrect or invalid configuration packages. This check acts as a quick validation layer *before* attempting the resource-intensive sample generation run.
- Checks:
  1. Does the generated configuration package conform to the **Universal Configuration Package Format schema**?
  2. Are all tool identifiers mentioned in the configuration package present in the **Toolbox registry**?
- **Benefit:** Reduces wasted resources on obviously invalid configurations and potentially provides faster feedback on internal errors.

## 6. API Endpoints for Transparency & Control

- **Tool Discovery (`GET /tools` - P1):**
  - **Purpose:** Provides users (and potentially the UI) visibility into the available building blocks The Brain uses. Essential for understanding capabilities and for enabling manual configuration.
  - **Output:** A list of available tool identifiers, names, types, and descriptions.
- **Manual Package Override (`POST /builds/manual` - P2):**
  - **Purpose:** Allows expert users or developers debugging the system to bypass the LLM entirely and specify an exact configuration package in the Universal Format.
  - **Use Cases:** Testing specific tool combinations, handling edge cases where the LLM consistently fails, creating baseline configurations.
  - **Flow:** Submits config package -> Sanity Check -> Sample Generation -> Confirmation. Skips LLM analysis/refinement.

## 7. Technical Requirements Summary (TypeScript Context)

- Robust LLM integration (API calls via SDKs/HTTP, prompt management, context handling).
- Clearly defined and versioned Universal Configuration Package Format (JSON Schema and/or TypeScript types/interfaces).
- Modular, extensible architecture for tools (Toolbox registry, TypeScript interfaces, dynamic module loading if needed, Execution Engine class).
- Asynchronous task processing framework suitable for Node.js/TypeScript (e.g., BullMQ, NestJS Queues, custom implementation with message queues like RabbitMQ/SQS).
- Suitable database(s) for storing build/run state, results, and the Knowledge Base (SQL, NoSQL/Document DB like MongoDB, Vector DB like Pinecone/Weaviate).
- Secure API endpoint design using a Node.js framework (e.g., NestJS, Express) with middleware for AuthN/AuthZ, Input Validation (e.g., class-validator), Rate Limiting.
- Comprehensive logging (e.g., Pino, Winston) and monitoring (e.g., Prometheus/Grafana, Datadog).

## 8. Potential Problems and Solutions

- Problem:

   

  LLM generates invalid/nonsensical configuration packages.

  - **Solutions:** Configuration Package Sanity Check; improved prompt engineering with constraints; providing examples (few-shot) in prompts; using the Knowledge Base for strong priors; robust error handling in the Execution Framework.

- Problem:

   

  LLM fails to understand complex feedback or gets stuck in refinement loops.

  - **Solutions:** Limit refinement cycles per build; improve LLM context/prompts; allow more structured feedback (`tool_hints`); provide clear error messages suggesting manual override or contacting support.

- Problem:

   

  Tool switching logic is fragile or picks inappropriate tools.

  - **Solutions:** Provide clear descriptions of tool capabilities/limitations to the LLM; use the Knowledge Base to guide tool selection based on platform/task; potentially add heuristics or rule-based checks alongside LLM decisions.

- Problem:

   

  A specific tool in the Toolbox has bugs or limitations.

  - **Solutions:** Isolate tool execution; robust error capturing per tool; versioning tools; fallback mechanisms if primary tool fails.

- Problem:

   

  Knowledge Base becomes outdated (sites change) or contains poor example packages.

  - **Solutions:** Implement mechanisms to decay the influence of older configurations; allow flagging/removal of bad KB entries; potentially re-validate KB entries periodically.

- Problem:

   

  Complexity leads to difficult debugging and maintenance.

  - **Solutions:** Strict modularity using TypeScript modules/interfaces; comprehensive logging tracing decisions; unit/integration tests (e.g., using Jest) for the Execution Framework and individual tools; clear documentation of the Universal Package Format and tool interfaces.

## 9. Conclusion



## Inspiration for Prompt of the core Brain

Implementing the adaptive core of The Brain API, particularly the refinement loop with tool-switching and knowledge base integration, is a significant engineering challenge requiring careful design of the LLM interaction, the modular architecture, and the data formats. However, this capability is precisely what offers the potential for a truly intelligent and user-friendly autonomous scraping solution. Prioritizing the foundational elements (Universal Configuration Package Format, Modular Framework, basic LLM build/refine) before advanced features like the Knowledge Base or extensive toolsets is crucial for a successful implementation in TypeScript.





Okay, based on the detailed documentation provided, here is a well-structured prompt designed to guide an LLM (like GPT-4) to perform the core refinement task (Section 2: The Core Refinement Loop Explained).

This prompt assumes you will programmatically insert the actual data into the placeholders (`{ ... }`).

```text
## ROLE ##
You are an expert AI assistant specializing in configuring and refining web scraping tasks. Your goal is to act as the "Configuration Engine" for "The Brain" API. You understand how different scraping tools (like Playwright, Cheerio-based parsers), anti-blocking measures (proxies, user-agents), and CAPTCHA solvers work together. You are proficient in generating configurations according to a specific JSON schema (the Universal Configuration Package Format).

## TASK ##
Analyze the provided user feedback in the context of the original objective, the previously attempted configuration package, and the results it produced. Generate a **new, refined Universal Configuration Package** (as a JSON object) that aims to address the user's feedback and better achieve the original objective. You may need to adjust parameters, modify scraping logic within the package, or switch to entirely different tools from the available Toolbox.

## CONTEXT ##

**1. Original User Objective:**
```
{user_objective}
```

**2. Target URLs:**
```
{target_urls_list}
```

**3. Previous Configuration Package (Version N):**
(This package generated the results the user provided feedback on)
```json
{previous_configuration_package_json}
```

**4. Sample Results from Previous Package (Version N):**
(These are the results the user reviewed and found unsatisfactory)
```json
{previous_package_results_json}
```

**5. New User Feedback:**
(The user's description of what was wrong with the previous results or what they want instead)
```
{user_feedback}
```

**6. (Optional) Relevant Knowledge Base Findings:**
(Successful configurations for similar objectives/platforms, if available)
```json
{knowledge_base_findings_json}
```

**7. Available Toolbox:**
(Descriptions of available tools, their capabilities, and identifiers)
```json
{toolbox_description_json}
```
*Example Tool Description Format:*
*   `{"tool_id": "playwright_scraper_v3", "type": "scraper", "description": "Full browser automation via Playwright. Handles JavaScript execution. Params: 'goto_options', 'evaluate_script', 'output_mapping', ...}", "capabilities": ["javascript_execution", "complex_interactions"]}`
*   `{"tool_id": "cheerio_parser_v1", "type": "scraper", "description": "Fast static HTML parser using Cheerio. Does not execute JavaScript. Params: 'selectors', 'attribute_extraction', 'output_mapping', ...}", "capabilities": ["static_html_parsing"]}`
*   `{"tool_id": "smart_proxy_manager_v2", "type": "proxy", "description": "Manages rotating proxy pool. Params: 'proxy_type', 'region', ...}", "capabilities": ["ip_rotation"]}`
*   `{"tool_id": "standard_user_agent_rotator_v1", "type": "anti-blocking", "description": "Cycles through common browser user-agents.", "capabilities": ["user_agent_spoofing"]}`
*   *...(Include all relevant tools)*

**8. Universal Configuration Package Format Schema:**
(The JSON schema definition that the output *must* conform to)
```json
{universal_package_format_schema_json}
```

## INSTRUCTIONS ##

1.  **Analyze Discrepancy:** Carefully compare the `Previous Sample Results` against the `Original User Objective` and the `New User Feedback`. Identify *why* the previous attempt failed to meet the user's needs.
2.  **Determine Refinement Strategy:** Decide whether to:
    *   **Adjust Parameters:** Modify settings within the tools used in the `Previous Configuration Package`.
    *   **Change Logic:** Alter the scraping logic or data mapping defined within the package.
    *   **Switch Tools:** Replace one or more tools in the package with different ones from the `Available Toolbox` if the current tools are fundamentally unsuitable (e.g., switching from a static parser to Playwright for a JS-heavy site). Base this decision on the `Available Toolbox` descriptions and capabilities.
3.  **Leverage Knowledge Base:** If `Knowledge Base Findings` are provided, strongly consider them as successful examples or starting points for the refinement.
4.  **Generate New Package:** Construct the *complete* new configuration package (Version N+1) as a JSON object.
5.  **Adhere to Schema:** Ensure the generated JSON package strictly conforms to the provided `Universal Configuration Package Format Schema`.
6.  **Focus on Output:** Your final output should ONLY be the new JSON configuration package. Do not include explanations or conversational text outside of the JSON structure itself.
7.  **If Unresolvable:** If the user feedback is contradictory, unclear, or cannot be addressed with the available tools and capabilities, output a JSON object like this: `{"error": "Cannot resolve feedback", "reason": "[Brief explanation]"}`.

## OUTPUT ##
(Generate ONLY the JSON object representing the new Universal Configuration Package)
```json
{/* LLM generates the new JSON package here */}
```