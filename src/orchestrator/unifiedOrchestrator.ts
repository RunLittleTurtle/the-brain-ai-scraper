// src/orchestrator/unifiedOrchestrator.ts
// Stub implementation of the UnifiedOrchestrator interface
// Dispatches tool calls based on orchestration mode (classic, mcp, both)

import { UnifiedOrchestrator, ToolCallInput, ToolCallResult, OrchestrationMode } from './orchestrator.interface.js';
import { MCPClientStub } from './mcpClient.js';

const mcpClient = new MCPClientStub();

export class UnifiedOrchestratorImpl implements UnifiedOrchestrator {
  async callTool(input: ToolCallInput, mode: OrchestrationMode): Promise<ToolCallResult> {
    const start = Date.now();
    if (mode === 'mcp') {
      // Use MCP client for tool invocation
      try {
        const output = await mcpClient.invokeTool(input.toolName, input.payload, input.context);
        return {
          output,
          error: undefined,
          mode,
          durationMs: Date.now() - start
        };
      } catch (err) {
        return {
          output: null,
          error: err instanceof Error ? err.message : String(err),
          mode,
          durationMs: Date.now() - start
        };
      }
    }
    if (mode === 'both') {
      // Dual mode: run classic and MCP in parallel, fallback to whichever succeeds first
      // Log mode selection
      console.log('[Orchestrator] Dual mode: running classic and MCP in parallel');

      // Classic stub
      const classicPromise = Promise.resolve({
        output: {
          calledTool: input.toolName,
          payload: input.payload,
          context: input.context || null,
          note: 'classic',
        },
        error: undefined,
        mode: 'classic' as OrchestrationMode,
        durationMs: 0
      });
      // MCP real stub
      const mcpPromise = mcpClient.invokeTool(input.toolName, input.payload, input.context)
        .then(output => ({
          output: {
            tool: input.toolName,
            calledTool: input.toolName,
            payload: input.payload,
            context: input.context || null,
            note: 'Stub: No actual MCP call performed.',
            schemaVersion: 'v1' // Required for validation
          },
          error: undefined,
          mode: 'mcp' as OrchestrationMode,
          durationMs: 0
        })).catch(err => ({
          output: null,
          error: err instanceof Error ? err.message : String(err),
          mode: 'mcp' as OrchestrationMode,
          durationMs: 0
        }));

      // Race for first success, collect both if both fail
      const results = await Promise.allSettled([classicPromise, mcpPromise]);
      const fulfilled = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<ToolCallResult>[];
      const successes = fulfilled.filter(r => !r.value.error);
      if (successes.length > 0) {
        // Prefer MCP if both succeed
        const mcpResult = successes.find(r => r.value.mode === 'mcp');
        if (mcpResult) {
          console.log('[Orchestrator] Dual mode: MCP succeeded, returning MCP result');
          return { ...mcpResult.value, durationMs: Date.now() - start, mode: 'both' };
        }
        // Otherwise, return classic
        console.log('[Orchestrator] Dual mode: Classic succeeded, returning classic result');
        return { ...successes[0].value, durationMs: Date.now() - start, mode: 'both' };
      }
      // If both failed, aggregate errors
      const errors = fulfilled.map(r => r.value.error).filter(Boolean);
      console.warn('[Orchestrator] Dual mode: Both classic and MCP failed', errors);
      return {
        output: null,
        error: `Both classic and MCP failed: ${errors.join(' | ')}`,
        mode: 'both',
        durationMs: Date.now() - start
      };
    }
    // Classic mode (stub)
    return {
      output: {
        calledTool: input.toolName,
        payload: input.payload,
        context: input.context || null,
        note: 'classic',
      },
      error: undefined,
      mode,
      durationMs: Date.now() - start
    };
  }
}
