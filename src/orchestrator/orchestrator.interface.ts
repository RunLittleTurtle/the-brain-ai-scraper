// src/orchestrator/orchestrator.interface.ts
// Unified Orchestrator Interface for Classic, MCP, and Dual modes
// Implements a single interface/class to dispatch tool calls based on orchestration mode.
// All local imports must use explicit .js extensions (per project rules).

export type OrchestrationMode = 'classic' | 'mcp' | 'both';

export interface ToolCallInput {
  toolName: string;
  payload: Record<string, any>;
  context?: Record<string, any>;
}

export interface ToolCallResult {
  output: any;
  error?: Error | string;
  mode: OrchestrationMode;
  durationMs?: number;
}

export interface UnifiedOrchestrator {
  /**
   * Dispatch a tool call according to the current orchestration mode.
   * @param input - Tool call details
   * @param mode - Orchestration mode: classic, mcp, or both
   */
  callTool(input: ToolCallInput, mode: OrchestrationMode): Promise<ToolCallResult>;
}

// TODO: Implement concrete orchestrator(s) in classic, mcp, and dual modes.
// TODO: Add tests for interface compliance.
