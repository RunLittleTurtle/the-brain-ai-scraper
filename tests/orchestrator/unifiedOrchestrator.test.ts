// tests/orchestrator/unifiedOrchestrator.test.ts
import { describe, it, expect } from 'vitest';
import { UnifiedOrchestratorImpl } from '../../src/orchestrator/unifiedOrchestrator.js';
import type { ToolCallInput, OrchestrationMode } from '../../src/orchestrator/orchestrator.interface.js';

describe('UnifiedOrchestratorImpl', () => {
  const orchestrator = new UnifiedOrchestratorImpl();
  const input: ToolCallInput = {
    toolName: 'testTool',
    payload: { foo: 'bar' },
    context: { user: 'test' }
  };

  const modes: OrchestrationMode[] = ['classic', 'mcp', 'both'];

  for (const mode of modes) {
    it(`callTool returns correct mode and structure for mode: ${mode}`, async () => {
      const result = await orchestrator.callTool(input, mode);
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('mode', mode);
      expect(result).toHaveProperty('durationMs');
      expect(result.error).toBeUndefined();
      expect(result.output).toMatchObject({
        calledTool: 'testTool',
        payload: { foo: 'bar' },
        context: { user: 'test' },
      });
    });
  }
});
