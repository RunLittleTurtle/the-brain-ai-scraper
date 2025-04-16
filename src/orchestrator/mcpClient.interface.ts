// src/orchestrator/mcpClient.interface.ts
// Interface for MCP protocol client for dynamic tool discovery/invocation
// All secrets/configs must be read from environment variables (never hardcoded)

export interface MCPClient {
  /**
   * Discover available tools via MCP protocol
   * @returns Array of tool names or metadata
   */
  discoverTools(): Promise<string[]>;

  /**
   * Invoke a tool via MCP protocol
   * @param toolName - Name of the tool to invoke
   * @param payload - Input payload for the tool
   * @param context - Optional context for invocation
   * @returns Output from the tool (raw or structured)
   */
  invokeTool(toolName: string, payload: Record<string, any>, context?: Record<string, any>): Promise<any>;
}

// TODO: Add MCP connection/auth config via env vars (see .env.example)
