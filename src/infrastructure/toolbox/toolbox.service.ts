import { ITool } from '../execution/tool.interface.js';
import { IToolbox } from '../../core/interfaces/toolbox.interface.js';
import { FetchCheerioScraper } from './fetch-cheerio.scraper.js';
import { PlaywrightScraper } from './playwright.scraper.js';
import { ProxyManagerTool } from './proxy-manager.tool.js';
import { AntiBlockingTool } from './anti-blocking.tool.js';

// MCP tool definition type (This might become redundant if SDK provides a usable type directly)
export interface McpToolDefinition {
  id: string;
  name?: string;
  description?: string;
  inputSchema?: Record<string, any>; // Consider using a more specific type like JSONSchema7
  annotations?: Record<string, any>;
}

/**
 * Concrete implementation of the IToolbox interface.
 * Manages tool registration and retrieval using an in-memory map.
 *
 * In a more complex scenario, this could be decorated or replaced
 * to load tools dynamically or from a configuration source.
 */
export class ToolboxService implements IToolbox {
  // Store both the tool instance and its MCP metadata
  private tools: Map<string, { instance: ITool, mcp: McpToolDefinition }> = new Map();
  private logger = console; // Basic logger

  /**
   * Registers a tool instance, making it available for use.
   * If a tool with the same ID already exists, it will be overwritten.
   * @param tool - The tool instance to register.
   */
  registerTool(tool: ITool): void {
    // Use MCP definition if available
    const getDef = (tool.constructor as any).getMcpDefinition;
    const mcp: McpToolDefinition = typeof getDef === 'function' ? getDef.call(tool.constructor) : {
      id: tool.toolId ?? '', // Provide fallback
      name: tool.toolId ?? '', // Provide fallback
      description: tool.description ?? '', // Provide fallback
      inputSchema: {},
      annotations: {}
    };
    // Adjust name if MCP def provided a different one
    if (typeof getDef === 'function') {
        const sdkDef = getDef.call(tool.constructor);
        mcp.name = sdkDef.name || tool.toolId;
        // Assign other properties from sdkDef if needed and present in local interface
        mcp.description = sdkDef.description || tool.description || '';
        mcp.inputSchema = sdkDef.inputSchema || {};
        mcp.annotations = sdkDef.annotations || {};
    }

    // Ensure the map key is a string, falling back to id if name is undefined
    const mapKey = mcp.name ?? mcp.id;

    if (this.tools.has(mapKey)) {
      this.logger.warn(`Tool with MCP name '${mapKey}' is already registered. Overwriting.`);
    }
    this.logger.log(`Registering tool: ${mapKey} (${tool.name || 'Unnamed Tool'})`);
    this.tools.set(mapKey, { instance: tool, mcp });
  }

  /**
   * Retrieves a registered tool instance by its unique identifier.
   * @param toolId - The unique ID of the tool to retrieve.
   * @returns The tool instance if found, otherwise undefined.
   */
  async getTool(toolId: string): Promise<ITool | undefined> {
    const entry = this.tools.get(toolId);
    return Promise.resolve(entry?.instance);
  }

  /**
   * Lists all registered tools.
   *
   * @returns An array of available tool instances.
   */
  listTools(): ITool[] {
    return Array.from(this.tools.values()).map(t => t.instance);
  }

  /**
   * Lists all MCP tool definitions for LLM/developer discovery.
   */
  listMcpTools(): McpToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.mcp);
  }

  /**
   * Calls a tool by MCP name with parameters (MCP-style invocation).
   * Optionally validate params against inputSchema (add ajv for full validation).
   */
  async callTool(name: string, params: any): Promise<any> {
    const entry = this.tools.get(name);
    if (!entry) throw new Error(`Tool ${name} not found`);
    // Optionally: validate params against entry.mcp.inputSchema
    // For scrapers, expect 'execute', for others, method varies
    if (typeof (entry.instance as any).execute === 'function') {
      return (entry.instance as any).execute(params.url, params);
    }
    // Try proxy or anti-blocking interfaces
    if (typeof (entry.instance as any).getProxyForUrl === 'function') {
      return (entry.instance as any).getProxyForUrl(params.targetUrl);
    }
    if (typeof (entry.instance as any).applyStrategies === 'function') {
      return (entry.instance as any).applyStrategies(params.context);
    }
    throw new Error(`Tool ${name} does not support a known MCP method.`);
  }

  /**
   * Get a self-reference for compatibility with dependency injection
   * @returns This instance as an IToolbox
   */
  getToolbox(): IToolbox {
    return this;
  }

  registerDefaultTools(): void {
    // Register all MCP-compliant tools
    this.registerTool(new FetchCheerioScraper());
    this.registerTool(new PlaywrightScraper());
    this.registerTool(new ProxyManagerTool());
    this.registerTool(new AntiBlockingTool());
  }
}

// Export a singleton instance (or manage via DI framework later)
export const toolboxService = new ToolboxService();

// Register available tools here during initialization
toolboxService.registerDefaultTools();
