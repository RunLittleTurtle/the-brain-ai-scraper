import * as cheerio from 'cheerio';
import { IScraperTool, ToolExecutionResult } from '../execution/tool.interface.js'; 
import { UniversalConfigurationPackageFormatV1, ToolConfiguration } from '../../core/domain/configuration-package.types.js';

interface FetchCheerioParams {
  selectors: { [outputKey: string]: string }; // e.g., { title: 'h1', description: '.desc' }
  attribute?: string; // Optional: 'text' (default), 'html', or specific attribute like 'href'
  baseUrl?: string; // Optional: Base URL for resolving relative links
  timeout_ms?: number; // Optional: Timeout in milliseconds
}

export class FetchCheerioScraper implements IScraperTool {
  /**
   * MCP-compliant tool definition for LLM discovery and developer clarity.
   */
  static getMcpDefinition() {
    return {
      name: "scraper_fetch_cheerio_v1",
      description: "IScraperTool: Scrapes static HTML content from a URL using Cheerio. Does not execute JavaScript.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Target URL to scrape" },
          selectors: { type: "object", description: "Key-value pairs of output field and CSS selector" },
          attribute: { type: "string", enum: ["text", "html"], description: "What to extract from selector (default: text)" },
          baseUrl: { type: "string", description: "Optional base URL for resolving relative links" },
          timeout_ms: { type: "number", description: "Optional timeout in milliseconds" }
        },
        required: ["url", "selectors"]
      },
      annotations: {
        title: "Static HTML Scraper (Cheerio)",
        openWorldHint: true
      }
    };
  }
  readonly toolId = 'scraper_fetch_cheerio_v1';
  readonly name = 'Fetch + Cheerio Scraper';
  readonly description = 'Fetches HTML using native fetch and extracts data using Cheerio selectors.';
  private config?: ToolConfiguration; // Store the config
  private logger = console; // Basic logger, replace with a proper one if needed

  // Implement the initialize method
  async initialize(config: ToolConfiguration): Promise<void> {
    this.logger.info(`[${this.toolId}] Initializing with config:`, JSON.stringify(config.parameters, null, 2));
    // Basic validation (can be expanded)
    if (!config.parameters?.selectors) {
      throw new Error(`[${this.toolId}] Missing required 'selectors' parameter in configuration.`);
    }
    this.config = config;
    this.logger.info(`[${this.toolId}] Initialization complete.`);
    // No async setup needed for this simple tool, so resolve immediately
    return Promise.resolve();
  }

  async execute(targetUrl: string, _fullPackage: UniversalConfigurationPackageFormatV1): Promise<ToolExecutionResult> {
    this.logger.info(`[${this.toolId}] Executing for URL: ${targetUrl}`);
    if (!this.config || !this.config.parameters) {
        return { success: false, error: `[${this.toolId}] Tool not initialized with configuration before execution.`, data: undefined };
    }

    // Use the stored config
    const params = this.config.parameters as FetchCheerioParams;
    const selectors = params.selectors;
    const attribute = params.attribute || 'text'; // Default to extracting text
    const timeout = params.timeout_ms || 5000; // Default timeout

    try {
      this.logger.info(`[${this.toolId}] Fetching HTML from ${targetUrl}...`);
      const html = await fetchHtml(targetUrl, timeout);
      const $ = cheerio.load(html);
      this.logger.info(`[${this.toolId}] HTML loaded. Extracting data...`);

      const extractedData: { [key: string]: any } = {};
      let extractionError: string | undefined;

      for (const key in selectors) {
        const selector = selectors[key];
        try {
          const element = $(selector);
          if (element.length > 0) {
            if (attribute === 'text') {
              extractedData[key] = element.first().text().trim();
            } else if (attribute === 'html') {
               extractedData[key] = element.first().html()?.trim();
            } else {
              extractedData[key] = element.first().attr(attribute);
            }
             this.logger.info(`[${this.toolId}] Extracted '${key}' using selector '${selector}': ${extractedData[key] ? String(extractedData[key]).substring(0, 50) + '...' : 'null'}`);
          } else {
            this.logger.warn(`[${this.toolId}] Selector '${selector}' for key '${key}' did not match any elements.`);
            extractedData[key] = null; // Or handle as needed
          }
        } catch (err: any) {
          const errorMsg = `Error extracting data for key '${key}' with selector '${selector}': ${err.message}`;
          this.logger.error(`[${this.toolId}] ${errorMsg}`);
          // Capture the first error, but continue trying other selectors
          if (!extractionError) extractionError = errorMsg;
          extractedData[key] = null;
        }
      }

      if (extractionError) {
          // If any selector failed, consider the overall result a partial failure but still return data
          return { success: false, error: `[${this.toolId}] Extraction partially failed: ${extractionError}`, data: extractedData };
      }

      this.logger.info(`[${this.toolId}] Extraction successful for ${targetUrl}.`);
      return { success: true, data: extractedData };

    } catch (error: any) {
      const errorMsg = `[${this.toolId}] Failed to execute for ${targetUrl}: ${error.message}`;
      this.logger.error(errorMsg);
      return { success: false, error: errorMsg, data: undefined };
    }
  }

  async cleanup(): Promise<void> {
    this.logger.info(`[${this.toolId}] Cleanup called.`);
    // No resources to release for this simple tool
    this.config = undefined; // Clear stored config
    this.logger.info(`[${this.toolId}] Cleanup complete.`);
    return Promise.resolve();
  }
}

// Helper function to fetch HTML
async function fetchHtml(url: string, timeout: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeoutId); // Clear timeout if fetch succeeded

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.text();
  } catch (error: any) {
    throw error;
  }
}
