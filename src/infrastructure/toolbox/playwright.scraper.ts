// src/infrastructure/toolbox/playwright.scraper.ts
import { chromium, Browser, Page, BrowserContext } from 'playwright'; // Use official Playwright for launching Chromium

import { IScraperTool, ToolExecutionResult } from '../execution/tool.interface.js';
import { ScraperToolConfiguration, SelectorResult, UniversalConfigurationPackageFormatV1 } from '../../core/domain/configuration-package.types.js';


export class PlaywrightScraper implements IScraperTool {
  /**
   * MCP-compliant tool definition for LLM discovery and developer clarity.
   */
  static getMcpDefinition() {
    return {
      name: "scraper_playwright_stealth_v1",
      description: "IScraperTool: Scrapes dynamic web pages by executing JavaScript using Playwright (Chromium).",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Target URL to scrape" },
          selectors: { type: "object", description: "Key-value pairs of output field and selector" },
          attribute: { type: "string", enum: ["innerText", "html", "value"], description: "What to extract from selector (default: innerText)" },
          timeout_ms: { type: "number", description: "Optional timeout in milliseconds" }
        },
        required: ["url", "selectors"]
      },
      annotations: {
        title: "Dynamic Web Scraper (Playwright)",
        openWorldHint: true
      }
    };
  }
    readonly toolId = 'scraper_playwright_stealth_v1';
    readonly name = 'Playwright Scraper';
    readonly description = 'Fetches and renders pages using Playwright (Chromium) to extract data.';
    private logger = console; // Basic logger
    private config: ScraperToolConfiguration | null = null;
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;

    async initialize(config: any): Promise<void> {
        this.logger.log(`[${this.toolId}] Initializing...`);
        // Basic validation
        if (!config || !config.parameters || !config.parameters.selectors) {
            throw new Error(`[${this.toolId}] Invalid configuration provided. 'selectors' parameter is required.`);
        }
        this.config = config as ScraperToolConfiguration; // Assume structure matches for now
        this.logger.log(`[${this.toolId}] Initialization complete.`);
    }

    /**
     * Executes the Playwright scraping process for a given URL.
     * @param targetUrl The URL to scrape.
     * @param fullPackage The full configuration package (used for context, e.g., proxies).
     * @returns A promise resolving to the ToolExecutionResult.
     */
    async execute(targetUrl: string, fullPackage: UniversalConfigurationPackageFormatV1): Promise<ToolExecutionResult> {
        if (!this.config || !this.config.parameters?.selectors) {
            throw new Error(`[${this.toolId}] Scraper not initialized or configuration is invalid.`);
        }
        this.logger.log(`[${this.toolId}] Executing for URL: ${targetUrl}`);

        const selectors = this.config.parameters.selectors;
        const attributeToExtract = this.config.parameters.attribute || 'innerText'; // Default to innerText
        const timeout = this.config.parameters.timeout_ms || 30000; // Default timeout

        try {
            // Launch browser if not already running (can be optimized later)
            if (!this.browser) {
                this.logger.log(`[${this.toolId}] Launching browser...`);
                this.browser = await chromium.launch({ headless: true }); // Use stealth-enabled chromium
            }
            // Create context and page for isolation
            this.context = await this.browser.newContext();
            const page = await this.context.newPage();
            page.setDefaultTimeout(timeout);

            this.logger.info(`Navigating to ${targetUrl}...`);
            await page.goto(targetUrl, {
                waitUntil: 'domcontentloaded', // Wait only for DOM content
                timeout: 20000 // Keep timeout for now
            });

            this.logger.log(`[${this.toolId}] Page loaded. Extracting data...`);

            const results: SelectorResult = {};

            for (const key in selectors) {
                const selector = selectors[key];
                try {
                    // Use Playwright's locator API
                    const locator = page.locator(selector).first(); // Take the first match
                    let extractedValue: string | null = null;

                    switch (attributeToExtract.toLowerCase()) {
                        case 'text':
                        case 'innertext':
                            extractedValue = await locator.innerText({ timeout: 5000 }); // Short timeout for extraction
                            break;
                        case 'html':
                        case 'innerhtml':
                            extractedValue = await locator.innerHTML({ timeout: 5000 });
                            break;
                        default:
                            // Extract specific attribute
                            extractedValue = await locator.getAttribute(attributeToExtract, { timeout: 5000 });
                    }

                    results[key] = extractedValue?.trim() ?? null;
                    this.logger.log(`[${this.toolId}] Extracted '${key}' using selector '${selector}': ${results[key]?.substring(0, 50)}...`);

                } catch (error: any) {
                    if (error.name === 'TimeoutError') {
                        this.logger.warn(`[${this.toolId}] Selector '${selector}' for key '${key}' timed out or did not match any elements.`);
                    } else {
                        this.logger.warn(`[${this.toolId}] Error extracting data for key '${key}' with selector '${selector}': ${error.message}`);
                    }
                    results[key] = null; // Set to null if extraction fails
                }
            }

            await page.close();
            await this.context.close(); // Clean up context
            this.context = null;
            this.logger.log(`[${this.toolId}] Extraction successful for ${targetUrl}.`);
            return {
                success: true,
                data: results,
                metadata: { url: targetUrl } // Example metadata
            };

        } catch (error: any) {
            this.logger.error(`[${this.toolId}] Failed to execute for ${targetUrl}: ${error}`);
            // Ensure context is closed on error
            if (this.context) {
                try { await this.context.close(); } catch (e) { /* ignore */ }
                this.context = null;
            }
            return {
                success: false,
                error: `Playwright execution failed: ${error.message}`,
                metadata: { url: targetUrl }
            };
        }
    }

    async cleanup(): Promise<void> {
        this.logger.log(`[${this.toolId}] Cleanup called.`);
        if (this.browser) {
            this.logger.log(`[${this.toolId}] Closing browser...`);
            await this.browser.close();
            this.browser = null;
        }
        this.logger.log(`[${this.toolId}] Cleanup complete.`);
    }
}
