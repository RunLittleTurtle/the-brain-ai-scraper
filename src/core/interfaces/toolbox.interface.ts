import { ITool } from '../../infrastructure/execution/tool.interface.js';

/**
 * Defines the contract for the Toolbox service/registry.
 * This component is responsible for managing and providing access
 * to all available tools within the system.
 */
export interface IToolbox {
  /**
   * Registers a tool instance, making it available for use.
   * @param tool - The tool instance to register.
   */
  registerTool(tool: ITool): void;

  /**
   * Retrieves a registered tool instance by its unique identifier.
   * @param toolId - The unique ID of the tool to retrieve.
   * @returns {Promise<ITool | undefined>} The tool instance or undefined if not found.
   */
  getTool(toolId: string): Promise<ITool | undefined>;

  /**
   * Lists all registered tools, potentially filtered by type.
   * Useful for discovery endpoints (e.g., GET /tools).
   * @param type - Optional filter to return only tools of a specific type.
   * @returns An array of available tool instances.
   */
  listTools(type?: string): ITool[];
}
