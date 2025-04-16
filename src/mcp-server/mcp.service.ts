import type { FastifyBaseLogger } from '../types/fastify.js'; // Use centralized types
import { McpToolDefinition, McpInvokePayload } from './mcp-types.js'; // Use local types
import { SimpleMCPClient } from './simple-mcp-client.js'; // Import the new client
import { NotFoundError, InternalServerError } from '../core/errors/index.js';

/**
 * Service layer for handling MCP logic by interacting with an MCP backend.
 */
export class McpService {
  private client: SimpleMCPClient; // Use the simple client
  private tools: McpToolDefinition[] = []; // Local cache of tools from backend
  private readonly logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger.child({ service: 'McpService' });

    const rpcUrl = process.env.MCP_RPC_URL;
    const sseUrl = process.env.MCP_SSE_URL;

    if (!rpcUrl) {
        this.logger.error('MCP_RPC_URL environment variable is not set.');
        throw new Error('MCP_RPC_URL must be configured for McpService.');
    }
    if (!sseUrl) {
        this.logger.warn('MCP_SSE_URL environment variable is not set. SSE features may not work.');
        // Decide if this is critical. For now, we allow proceeding without SSE URL.
        // throw new Error('MCP_SSE_URL must be configured.');
    }

    // Initialize the SimpleMCPClient
    this.client = new SimpleMCPClient(rpcUrl, sseUrl || ''); // Pass empty string if sseUrl is missing
    this.logger.info(`McpService initialized. RPC: ${rpcUrl}, SSE: ${sseUrl || 'Not configured'}`);

    // Fetch tools from the backend on startup
    this.initializeTools().catch(err => {
        // Log error but allow service to start, potentially with empty tool list
        this.logger.error({ err }, 'Initial tool fetch failed during McpService startup.');
    });

    // TODO: Optionally subscribe to SSE events if needed
    // if (sseUrl) {
    //     this.client.subscribeEvents(event => this.handleMcpEvent(event));
    // }
  }

  /**
   * Fetches the tool list from the MCP backend and caches it.
   */
  private async initializeTools(): Promise<void> {
    this.logger.info('Initializing tools: Fetching list from MCP backend...');
    try {
        const backendTools = await this.client.listTools();
        this.tools = backendTools; // Replace local cache with backend list
        this.logger.info(`Successfully initialized ${this.tools.length} tools from backend.`);
    } catch (error) {
        this.logger.error({ err: error }, 'Failed to fetch tools from MCP backend.');
        this.tools = []; // Default to empty list on error
        // Optionally re-throw if fetching tools is critical for startup
        // throw new Error('Failed to initialize MCP tools from backend.');
    }
  }

  /**
   * Returns the cached list of available tools fetched from the backend.
   */
  listTools(): McpToolDefinition[] {
    this.logger.info(`Returning cached list of ${this.tools.length} tools.`);
    // Consider adding logic to refresh the cache if needed
    return this.tools;
  }

  /**
   * Invokes a specific tool via the MCP backend using the SimpleMCPClient.
   */
  async invokeTool(payload: McpInvokePayload): Promise<any> {
    this.logger.info({ toolName: payload.toolName }, 'Invoking tool via MCP backend...');

    // No need to check local tool list if invoking directly via backend client
    // The backend will handle whether the tool exists or not.

    try {
      const result = await this.client.callTool(payload);
      this.logger.info({ toolName: payload.toolName }, 'Tool invoked successfully via MCP backend.');
      return result;
    } catch (error: any) {
      this.logger.error({ err: error, toolName: payload.toolName }, 'Error invoking tool via MCP backend');
      // Check if the error message indicates a tool not found (customize based on SimpleMCPClient error format)
      if (error instanceof Error && error.message.toLowerCase().includes('tool not found')) { 
          throw new NotFoundError(`Tool '${payload.toolName}' not found on MCP backend.`);
      } else if (error instanceof Error && error.message.includes('MCP Error')) {
          // Handle generic MCP errors reported by the client
          throw new InternalServerError(`MCP backend error: ${error.message}`);
      }
      // Re-throw other unexpected errors
      throw new InternalServerError(`Unexpected error invoking tool '${payload.toolName}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Optional: Placeholder for handling SSE events
  // private handleMcpEvent(event: any): void {
  //   this.logger.info({ event }, 'Received MCP event via SSE');
  //   // ... implementation ...
  // }
}
