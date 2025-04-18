<!--
This document is the single source of truth for the LLM coding assistant. The LLM should reference, update, and maintain this doc as the project evolves. All architectural, design, and implementation decisions should be reflected here.
-->

# C4
```mermaid
C4Context
 title System Context diagram for "The Brain" API (Current & Future)

 %%--- ACTORS ---
 Person(user, "API Client/User", "Configures and runs scraping tasks, retrieves results, manages builds/runs.")
 Person(mcp_client, "MCP Client (Internal/External)", "Uses the MCP protocol to discover and invoke tools/resources. Can be internal (orchestrator) or external (other services).")
 Person(admin, "Admin/Operator", "Monitors, manages, and configures the system (via CLI/terminal).")

 %%--- SYSTEM BOUNDARY ---
 System_Boundary(the_brain, "The Brain API") {
 Container(api_gateway, "API Gateway", "Exposes REST endpoints for builds, runs, tools, and admin functions.")
 Container(analysis_service, "Analysis Service", "LLM-driven analysis of objectives and URLs, produces config packages.")
 Container(tool_orchestrator, "Tool Orchestrator", "Handles tool selection and invocation via classic, MCP, or dual (A/B testing). Uses MCP protocol internally.")
 Container(execution_engine, "Execution Engine", "Executes scraping runs using selected tools from the Toolbox. Handles run progress, cancellation, and reporting.")
 Container(knowledge_base, "Knowledge Base", "Stores successful config packages, embeddings, and platform fingerprints for reuse.")
 Container(abtest_analytics, "A/B Test Analytics", "Records and analyzes tool performance, orchestration outcomes, and MCP logs.")
 }

 %%--- EXTERNAL SYSTEMS ---
 System_Ext(toolbox, "Toolbox", "Registry and interface for all tools: scrapers (Cheerio, Playwright), CAPTCHA solvers, proxy rotators, enrichers, etc.")
 System_Ext(llm, "LLM Provider", "e.g., OpenAI API. Used for analysis and config generation.")
 System_Ext(target_sites, "Target Websites", "The external websites to be scraped.")
 System_Ext(vector_db, "Vector DB (future)", "Stores embeddings for semantic search and reuse.")
 System_Ext(monitoring, "Monitoring/Alerting (future)", "External monitoring and alerting systems (e.g., Prometheus, PagerDuty).")

 %%--- RELATIONSHIPS ---
 Rel(user, api_gateway, "Uses API (HTTPS)")
 Rel(mcp_client, tool_orchestrator, "Discovers & invokes tools/resources via MCP protocol")
 Rel(admin, api_gateway, "Manages system, views analytics, configures tools (via CLI/terminal)")

 Rel(api_gateway, analysis_service, "Submits objectives/URLs for analysis (internal call)")
 Rel(analysis_service, llm, "Sends prompts for analysis/config (API Call)")
 Rel(api_gateway, tool_orchestrator, "Requests tool orchestration for builds/runs (internal call)")
 Rel(tool_orchestrator, execution_engine, "Invokes tool execution (internal call)")
 Rel(execution_engine, toolbox, "Selects and invokes tools (scrapers, solvers, proxies, etc.)")
 Rel(execution_engine, target_sites, "Scrapes data from (HTTP(S)/Browser Automation)")
 Rel(tool_orchestrator, abtest_analytics, "Records orchestration, A/B test, and MCP logs (internal call)")
 Rel(api_gateway, knowledge_base, "Saves/retrieves config packages, embeddings, fingerprints (internal call)")
 Rel(knowledge_base, vector_db, "Stores/fetches embeddings for semantic search (future)")
 Rel(api_gateway, monitoring, "Sends metrics, alerts, logs (future)")

```