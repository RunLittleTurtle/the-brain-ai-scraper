// tests/regression/orchestrator.regression.test.ts
import { describe, it, expect } from 'vitest';
import { UnifiedOrchestratorImpl } from '../../src/orchestrator/unifiedOrchestrator.js';

describe('Orchestrator Regression Suite', () => {
  const orchestrator = new UnifiedOrchestratorImpl();
  const input = {
    toolName: 'playwright_v1',
    payload: { url: 'https://example.com' },
    context: { user: 'test' }
  };

  it('classic mode: returns classic stub result', async () => {
    const result = await orchestrator.callTool(input, 'classic');
    expect(result).toHaveProperty('output');
    expect(result.mode).toBe('classic');
    expect(result.output).toHaveProperty('calledTool', 'playwright_v1');
    expect(result.output.note).toContain('classic');
    expect(result.error).toBeUndefined();
  });

  it('mcp mode: returns MCP stub result', async () => {
    const result = await orchestrator.callTool(input, 'mcp');
    expect(result).toHaveProperty('output');
    expect(result.mode).toBe('mcp');
    expect(result.output).toHaveProperty('tool', 'playwright_v1');
    expect(result.output.note).toContain('MCP');
    expect(result.error).toBeUndefined();
  });

  it('both mode: prefers MCP if both succeed', async () => {
    const result = await orchestrator.callTool(input, 'both');
    expect(result).toHaveProperty('output');
    expect(result.mode).toBe('both');
    // Should contain stub MCP output
    expect(result.output).toHaveProperty('tool', 'playwright_v1');
    expect(result.output.note).toContain('MCP');
    expect(result.error).toBeUndefined();
  });

  it('both mode: falls back to classic if MCP fails', async () => {
    const failInput = { ...input, toolName: 'throw_mcp' };
    const result = await orchestrator.callTool(failInput, 'both');
    expect(result).toHaveProperty('output');
    expect(result.mode).toBe('both');
    expect(result.output).toHaveProperty('calledTool', 'throw_mcp');
    expect(result.output.note).toContain('classic');
    expect(result.error).toBeUndefined();
  });
});
