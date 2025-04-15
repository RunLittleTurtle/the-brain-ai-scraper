import { ToolConfiguration } from '../domain/configuration-package.types.js';

/**
 * Represents the results of a tool's execution.
 * Structure can be adapted based on tool type (scraper vs. auxiliary).
 */
export interface ToolResult {
  success: boolean;
  data?: any; // Structured data for scrapers, status/info for auxiliary
  error?: {
    message: string;
    details?: any;
  };
  metadata?: { [key: string]: any }; // E.g., final URL, status code for scrapers
}

/**
 * Defines the standard contract for any tool usable by the Execution Engine.
 * Each tool (scraper, proxy, anti-blocker, etc.) must implement this interface.
 */
export interface ITool {
  /**
   * Unique identifier for the tool (matches tool_id in configuration).
   */
  readonly id: string;

  /**
   * Human-readable name of the tool.
   */
  readonly name: string;

  /**
   * Type of the tool (e.g., 'scraper', 'proxy', 'anti-blocking', 'captcha').
   */
  readonly type: string;

  /**
   * Description of the tool's capabilities and purpose.
   */
  readonly description: string;

  /**
   * Initializes the tool instance with its specific configuration.
   * This might involve setting up internal state, connections, etc.
   * @param config - The configuration specific to this tool instance.
   * @returns Promise resolving when initialization is complete, or rejecting on error.
   */
  initialize(config: ToolConfiguration): Promise<void>;

  /**
   * Executes the primary action of the tool.
   * The exact parameters will vary significantly based on the tool type.
   * For example, a scraper needs a URL, while a proxy manager might just provide config.
   *
   * @param context - An object containing necessary context (e.g., target URL for scrapers).
   * @returns Promise resolving with the ToolResult.
   */
  run(context: { [key: string]: any }): Promise<ToolResult>;

  /**
   * Performs any necessary cleanup after the tool is used.
   * E.g., closing browser instances, database connections.
   * @returns Promise resolving when cleanup is complete.
   */
  cleanup?(): Promise<void>;
}
