// tests/orchestrator/unifiedOrchestrator.both.test.ts
import { describe, it, expect, vi } from 'vitest';
import { UnifiedOrchestratorImpl } from '../../src/orchestrator/unifiedOrchestrator.js';

// Test Dual Mode (both) integration with UnifiedOrchestratorImpl

describe('UnifiedOrchestratorImpl (Dual Mode)', () => {
  const orchestrator = new UnifiedOrchestratorImpl();

  it('callTool (mode: both) should prefer MCP if both succeed', async () => {
    const input = {
      toolName: 'playwright_v1',
      payload: { url: 'https://example.com' },
      context: { user: 'test' }
    };
    const result = await orchestrator.callTool(input, 'both');
    expect(result).toHaveProperty('output');
    expect(result).toHaveProperty('mode', 'both');
    expect(result).toHaveProperty('durationMs');
    expect(result.error).toBeUndefined();
    // Should contain stub MCP output
    expect(result.output).toMatchObject({
      tool: 'playwright_v1',
      payload: { url: 'https://example.com' },
      context: { user: 'test' },
      note: expect.stringContaining('Stub: No actual MCP call performed.')
    });
  });

  it('callTool (mode: both) should fallback to classic if MCP fails', async () => {
    // Patch MCPClientStub to throw
    const orchestrator = new UnifiedOrchestratorImpl();
    const input = {
      toolName: 'throw_mcp',
      payload: {},
      context: {}
    };
    // Patch MCPClientStub.invokeTool to throw for this test
    const orig = orchestrator['__proto__'].constructor.prototype;
    const origMcp = orig.callTool;
    // Patch the MCP stub to throw for this toolName
    vi.spyOn(orig, 'callTool').mockImplementationOnce(async (input, mode) => {
      if (mode === 'mcp') throw new Error('MCP failure');
      return origMcp.call(this, input, mode);
    });
    // Should fallback to classic
    const result = await orchestrator.callTool(input, 'both');
    expect(result).toHaveProperty('output');
    expect(result).toHaveProperty('mode', 'both');
    expect(result.error).toBeUndefined();
    expect(result.output).toMatchObject({
      calledTool: 'throw_mcp',
      note: expect.stringContaining('classic')
    });
    vi.restoreAllMocks();
  });
});
