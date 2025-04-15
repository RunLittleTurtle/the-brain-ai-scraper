/**
 * Defines the structure for the Universal Configuration Package Format.
 * This package describes the complete set of tools and their configurations
 * needed to execute a specific scraping build or run.
 * Version: 1.0
 */

/**
 * Represents the configuration for a single tool within the package.
 */
export interface ToolConfiguration {
  tool_id: string; // Unique identifier of the tool (e.g., 'scraper:playwright_stealth_v1')
  // Tool-specific parameters. The structure depends entirely on the tool_id.
  // Examples are illustrative.
  parameters: {
    // Common parameters (might not apply to all tools)
    retries?: number;
    timeout_ms?: number;

    // Scraper-specific (example for playwright_stealth_v1)
    goto_options?: any; // Playwright goto options
    wait_selector?: string;
    interaction_script?: string; // Sequence of clicks, scrolls, waits
    evaluate_script?: string; // JS code to run in page context for extraction
    output_mapping?: { [key: string]: string }; // Map extracted data to output fields

    // Proxy-specific (example for proxy:manager_rotating_v1)
    proxy_list?: string[];
    rotation_mode?: 'round-robin' | 'random';

    // Anti-block specific (example for antiblock:fingerprint_v1)
    screen?: { width: number; height: number };
    webglVendor?: string;
    // ... other fingerprint overrides

    // Add other tool-specific parameter examples as needed
    [key: string]: any; // Allows for arbitrary tool parameters
  };
}

/**
 * Represents the key-value pairs extracted by a scraper tool.
 * Keys are the user-defined names for the data points.
 * Values are the extracted strings or null if not found/error.
 */
export type SelectorResult = {
  [key: string]: string | null;
};

/**
 * Represents the specific configuration for a Scraper tool.
 * Extends the base ToolConfiguration and may add scraper-specific requirements.
 */
export interface ScraperToolConfiguration extends ToolConfiguration {
  parameters: ToolConfiguration['parameters'] & { // Ensure base parameters + scraper specific
    selectors: { [key: string]: string }; // Map of output key to CSS selector
    attribute?: 'text' | 'innerText' | 'innerHTML' | string; // Attribute to extract (default: innerText)
    // Add other common scraper parameters here if needed
  };
}

/**
 * The main Universal Configuration Package Format structure (Version 1).
 */
export interface UniversalConfigurationPackageFormatV1 {
  schemaVersion: '1.0';
  packageId?: string; // Optional unique ID for this specific package instance
  description?: string; // Optional description of what this package does

  // The primary scraping tool configuration
  scraper: ScraperToolConfiguration; // Use the more specific type

  // Optional auxiliary tool configurations
  proxy?: ToolConfiguration;
  antiBlocking?: ToolConfiguration[]; // Can have multiple anti-blocking techniques
  captchaSolver?: ToolConfiguration;

  // Metadata about the expected output (optional but recommended)
  expectedOutputSchema?: {
    // Define expected fields and types, e.g., using JSON Schema object structure
    type: 'object';
    properties: { [key: string]: { type: string; description?: string } };
    required?: string[];
  };
}
