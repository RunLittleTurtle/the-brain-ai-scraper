import { ITool } from '../../infrastructure/execution/tool.interface.js';
import { IToolbox } from '../../core/interfaces/toolbox.interface.js';
import { FetchCheerioScraper } from './fetch-cheerio.scraper.js';
import { PlaywrightScraper } from './playwright.scraper.js';

/**
 * Concrete implementation of the IToolbox interface.
 * Manages tool registration and retrieval using an in-memory map.
 *
 * In a more complex scenario, this could be decorated or replaced
 * to load tools dynamically or from a configuration source.
 */
export class ToolboxService implements IToolbox {
  private tools: Map<string, ITool> = new Map();
  private logger = console; // Basic logger

  /**
   * Registers a tool instance, making it available for use.
   * If a tool with the same ID already exists, it will be overwritten.
   * @param tool - The tool instance to register.
   */
  registerTool(tool: ITool): void {
    if (this.tools.has(tool.toolId)) {
      this.logger.warn(`Tool with ID '${tool.toolId}' is already registered. Overwriting.`);
    }
    this.logger.log(`Registering tool: ${tool.toolId} (${tool.name || 'Unnamed Tool'})`);
    this.tools.set(tool.toolId, tool);
  }

  /**
   * Retrieves a registered tool instance by its unique identifier.
   * @param toolId - The unique ID of the tool to retrieve.
   * @returns The tool instance if found, otherwise undefined.
   */
  async getTool(toolId: string): Promise<ITool | undefined> {
    const tool = this.tools.get(toolId);
    return Promise.resolve(tool);
  }

  /**
   * Lists all registered tools.
   *
   * @returns An array of available tool instances.
   */
  listTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  registerDefaultTools(): void {
    const fetchCheerio = new FetchCheerioScraper();
    this.registerTool(fetchCheerio);

    const playwrightScraper = new PlaywrightScraper();
    this.registerTool(playwrightScraper);
  }
}

// Export a singleton instance (or manage via DI framework later)
export const toolboxService = new ToolboxService();

// Register available tools here during initialization
toolboxService.registerDefaultTools();
