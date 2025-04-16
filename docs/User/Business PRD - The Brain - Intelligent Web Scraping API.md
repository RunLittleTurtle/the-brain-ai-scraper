<!--
These files are intended to provide human context and business/user perspective. The LLM should use these to better understand the project from the human/user point of view, but should not treat them as the technical source of truth.
-->

# Business PRD - "The Brain" - Intelligent Web Scraping API

**1. Context and Problem:**

*   **The Challenge:** Developers across various domains (market intelligence, data analysis, application building, lead generation, monitoring) frequently need to extract structured data from websites. However, modern web scraping is fraught with challenges:
    *   **Complexity:** Target sites use dynamic JavaScript rendering, complex DOM structures, and require intricate interaction logic.
    *   **Anti-Scraping Measures:** Websites actively deploy sophisticated anti-bot technologies (CAPTCHAs, IP blocks, browser fingerprinting, behavioral analysis) making reliable extraction difficult and resource-intensive.
    *   **Brittleness & Maintenance:** Scrapers constantly break due to website layout changes, requiring significant ongoing developer time for maintenance, debugging, and adaptation.
    *   **Tooling Overhead:** Effectively scraping requires deep expertise in tools like Playwright/Puppeteer, managing proxy networks, handling browser contexts, and parsing inconsistent HTML.
    *   **Focus Diversion:** Developers end up spending excessive time building and maintaining scraping infrastructure instead of focusing on their core application logic and utilizing the extracted data.
*   **Existing Solutions (e.g., Apify Ecosystem):** While platforms like Apify offer powerful tools and pre-built "Actors," they often require developers to:
    *   Select, configure, and sometimes customize specific scrapers (Actors) for each distinct task or website type.
    *   Manage the execution and orchestration of these multiple actors.
    *   Incur costs that can scale rapidly based on the number of actors used, compute units, proxy usage, and data retention, potentially becoming very expensive for comprehensive scraping needs.
    *   Still possess significant technical understanding to choose the *right* actor and configure it optimally.

**2. Solution and Value for the User (Developer):**

*   **The Solution: "The Brain" API:** An intelligent, API-first microservice designed to automate the complexities of web data extraction. Developers interact with a simple API, providing target URLs and their data objective in natural language or structured format. "The Brain" handles the rest.
*   **How it Works:**
    1.  Receives developer request (URLs, objective) via API.
    2.  Uses a Large Language Model (LLM) to analyze the objective and the target website(s).
    3.  Intelligently selects, configures, and combines appropriate scraping tools and techniques (`Playwright`, `Crawlee`, proxies, anti-detection methods) from its internal "Toolbox".
    4.  Executes trial runs, analyzes results, and iteratively refines the scraping strategy (potentially incorporating developer feedback via the API).
    5.  Executes the full scrape using the optimized strategy.
    6.  Returns clean, structured JSON data via the API.
*   **Core Value for Developers:**
    *   **"Describe What, Not How":** Developers focus on *what* data they need, not *how* to get it. The API abstracts away the need for selector writing, browser automation code, and anti-bot workarounds.
    *   **Drastically Reduced Maintenance:** The LLM-driven approach aims to be more resilient to minor site changes. The service manages the underlying tools and techniques, significantly reducing the developer's maintenance burden.
    *   **Simplified Integration:** A clean REST API with predictable JSON output makes integrating data into applications straightforward.
    *   **Lower Barrier to Entry:** Enables developers with less scraping-specific expertise to tackle complex data extraction tasks.
    *   **Focus Shift:** Frees up developer time to build core product features instead of wrestling with scraping infrastructure.
    *   **Efficiency (Built with Fastify):** The underlying Fastify framework ensures the API service is highly performant, particularly crucial for handling potentially large JSON payloads efficiently. Its schema-based validation provides robust and reliable API interactions. The plugin architecture enables maintainable and scalable internal development, leading to a more stable service for the consuming developer.

**3. Objective for the Product:**

*   **Primary Goal:** Establish "The Brain" as the preferred API for developers seeking automated, reliable, and low-maintenance web data extraction.
*   **Key Objectives (Year 1):**
    *   Successfully serve the internal "Universal Web Scraper SaaS" as the first primary client, validating the API's robustness and functionality.
    *   Launch public API access via the SaaS platform's developer portal.
    *   Gather developer feedback to iteratively improve LLM strategy generation and tool selection accuracy.

**4. Specific Use Case:**

*   **User:** A developer building a competitive intelligence dashboard for e-commerce products.
*   **Need:** Extract product name, price, rating, and stock availability daily from 50 different competitor product pages across various e-commerce platforms.
*   **Using "The Brain" API:**
    1. Developer signs up on the "Universal Web Scraper SaaS" portal and obtains an API key.
    2. Makes a single `POST /builds` request:
       ```json
       {
         "target_urls": ["url1", "url2", ..., "url50"],
         "user_objective": "For each product page, extract the product name, current price (including currency symbol), customer rating (e.g., 4.5 out of 5), and stock availability (e.g., 'In Stock', 'Out of Stock', quantity if available)."
       }
       ```
    3. The API processes, returning real samples from an initial testing scrape for user review. Developer give feedback on the json and the configuration via `POST /builds/{id}/configure`.
    4. The API reconfigure the scrapers, the tools and proxy, processes, returning a second real samples from a second testing scrape for user review.  If the json output is good, then the developper `POST /builds/{id}/confirm`. If it's still not on point, then the eveloper give feedback on the json and the configuration via `POST /builds/{id}/configure` , and the API reconfigure and try another package of tools.
    5. Developer sets up a scheduled job (e.g., daily cron) in their own backend to call `POST /runs` using the confirmed configuration.
    6. The scheduled job periodically checks the run status via `GET /runs/{run_id}`.
    7. Upon completion, the job fetches the results: an array of structured JSON objects, one per URL, containing the requested data fields.
       ```json
       [
         { "url": "url1", "product_name": "Gadget Pro", "price": "$99.99", "rating": "4.7 out of 5", "availability": "In Stock" },
         { "url": "url2", "product_name": "Widget Plus", "price": "€49.50", "rating": "4.2 out of 5", "availability": "Out of Stock" },
         ...
       ]
       ```
    8. The developer easily ingests this JSON into their dashboard's database.
*   **Contrast:** Without "The Brain," this would require writing/maintaining dozens of fragile scrapers, handling different site structures, logins, dynamic pricing elements, and anti-bot measures, a massive development and maintenance effort.
*   **Flexibility:** The developper have access to all the tools in the scraper API tool box. he can let the LLM choose and make the configuration, or he can tell the LLM which tool to try and use in order to have the desired output.

**5. Value Proposition:**

*   **For Developers:** "Stop Building Fragile Scrapers. Start Using Intelligent Data Extraction."
*   **Core Messages:**
    *   **Automate the Hard Parts:** Leverage LLM intelligence to automatically generate and manage scraping strategies, bypassing the complexities of selectors, JavaScript execution, and anti-bot techniques.
    *   **Slash Maintenance Costs:** Drastically reduce the time spent fixing scrapers broken by website updates. "The Brain" adapts, so you don't have to.
    *   **Get Clean Data, Faster:** Integrate reliable, structured JSON data into your application with simple API calls, accelerating your development cycle.
    *   **Pay for Results, Not Hassle:** (Assuming a suitable pricing model) Focus your budget on successful data extraction, potentially offering a better ROI compared to managing numerous specialized tools and absorbing high development/maintenance overhead.
    *   **Built for Performance & Reliability:** Powered by Fastify for a fast, efficient, and dependable API experience capable of handling demanding data payloads.

---

This PRD positions "The Brain" API as a developer-centric solution that directly addresses the primary pain points of traditional web scraping by offering automation, reduced maintenance, and ease of use, contrasting it favorably with potentially more complex and costly ecosystems. The Fastify foundation is highlighted as a technical benefit enabling performance and reliability for the developer consuming the API.