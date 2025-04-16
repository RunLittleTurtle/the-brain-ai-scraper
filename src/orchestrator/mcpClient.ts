// src/orchestrator/mcpClient.ts
// Stub implementation of MCPClient interface
// Reads MCP connection config from environment variables

import type { MCPClient } from './mcpClient.interface.js';

// TODO: Configure SECRET environment variable: MCP_API_KEY
const MCP_API_KEY = process.env.MCP_API_KEY;

export class MCPClientStub implements MCPClient {
  async discoverTools(): Promise<string[]> {
    // Stub: return fake tool list
    return ['playwright_v1', 'cheerio_parser_v2'];
  }

  async invokeTool(toolName: string, payload: Record<string, any>, context?: Record<string, any>): Promise<any> {
    // For testing: throw if toolName === 'throw_mcp' to simulate MCP failure
    if (toolName === 'throw_mcp') {
      throw new Error('Simulated MCP failure');
    }
    // Stub: echo the call for now
    // Add schemaVersion to match AnalysisService MCP output validation requirements
    return {
      tool: toolName,
      calledTool: toolName,
      payload,
      context: context || null,
      note: 'Stub: No actual MCP call performed.',
      schemaVersion: 'v1' // Required for validation
    };
  }
}
