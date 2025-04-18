import { ToolConfiguration, UniversalConfigurationPackageFormatV1 } from '../../core/domain/configuration-package.types.js';

/**
 * Represents the result of executing a tool, particularly a scraper.
 */
export interface ToolExecutionResult {
  success: boolean; // Whether the execution for a specific target succeeded
  url?: string; // The URL that was processed by this execution
  data?: Record<string, any> | Record<string, any>[]; // Extracted data, if successful
  error?: string; // Error message, if execution failed
  metadata?: Record<string, any>; // Optional: Additional metadata (e.g., status code, timings)
  // Add other relevant result metadata (e.g., logs, metrics)
}

/**
 * Base interface for all executable tools within the framework.
 */
export interface ITool {
  readonly toolId: string; // The unique identifier of the tool implementation
  readonly name?: string; // User-friendly name for the tool
  readonly description?: string; // Short description of what the tool does

  /**
   * Initializes the tool with its specific configuration.
   * Should be called before execute.
   * @param config The configuration specific to this tool instance.
   */
  initialize(config: ToolConfiguration): Promise<void>;

  /**
   * Optional method to clean up any resources held by the tool instance.
   * Called after execution is complete (or has failed).
   */
  cleanup?(): Promise<void>;
}

/**
 * Interface for primary scraper tools.
 */
export interface IScraperTool extends ITool {
  /**
   * Executes the scraping task for a given URL using the full package context.
   * @param targetUrl The specific URL to scrape.
   * @param fullPackage The complete configuration package for context (e.g., access to proxy settings).
   * @returns A promise resolving to the structured scraping result or error.
   */
  execute(targetUrl: string, fullPackage: UniversalConfigurationPackageFormatV1): Promise<ToolExecutionResult>;
}

/**
 * Base interface for auxiliary tools (e.g., Proxy Managers, Anti-Blocking tools).
 * Their specific methods might vary significantly.
 */
export interface IAuxiliaryTool extends ITool {
  // Auxiliary tools might not have a single 'execute' method like scrapers.
  // They might expose specific functionalities, e.g.:
  // getProxy?(): Promise<string | null>;
  // applyAntiBlockMeasures?(): Promise<void>;
  // We might need more specific interfaces inheriting from this for different aux tool types.
}

// Example of a more specific auxiliary tool interface
export interface IProxyManagerTool extends IAuxiliaryTool {
  getProxyForUrl(targetUrl: string): Promise<string | null>;
}

// Example of a more specific auxiliary tool interface
export interface ICaptchaSolverTool extends IAuxiliaryTool {
  solveCaptcha(captchaDetails: any): Promise<string>; // Returns solver token
}

// Example of a more specific auxiliary tool interface
export interface IAntiBlockingTool extends IAuxiliaryTool {
  // Method to potentially modify browser contexts or request headers
  applyStrategies(context: any): Promise<void>; 
}
