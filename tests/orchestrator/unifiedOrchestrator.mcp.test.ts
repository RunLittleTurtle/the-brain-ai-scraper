// tests/orchestrator/unifiedOrchestrator.mcp.test.ts
import { describe, it, expect } from 'vitest';
import { UnifiedOrchestratorImpl } from '../../src/orchestrator/unifiedOrchestrator.js';

// Test MCP mode integration with UnifiedOrchestratorImpl

describe('UnifiedOrchestratorImpl (MCP Mode)', () => {
  const orchestrator = new UnifiedOrchestratorImpl();

  it('callTool (mode: mcp) should use MCPClientStub and return stub output', async () => {
    const input = {
      toolName: 'playwright_v1',
      payload: { url: 'https://example.com' },
      context: { user: 'test' }
    };
    const result = await orchestrator.callTool(input, 'mcp');
    expect(result).toHaveProperty('output');
    expect(result).toHaveProperty('mode', 'mcp');
    expect(result).toHaveProperty('durationMs');
    expect(result.error).toBeUndefined();
    expect(result.output).toMatchObject({
      tool: 'playwright_v1',
      payload: { url: 'https://example.com' },
      context: { user: 'test' },
      note: expect.stringContaining('Stub: No actual MCP call performed.')
    });
  });
});
