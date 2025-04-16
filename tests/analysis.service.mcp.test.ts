import { describe, it, expect, vi } from 'vitest';
import { AnalysisService } from '../dist/modules/analysis/analysis.service.js';
// Custom orchestrator stub for robust MCP test
type ToolCallResult = { output: any; error?: string; mode: string; durationMs?: number };
const testMcpOrchestrator = {
  async callTool(input: any, mode: string): Promise<ToolCallResult> {
    if (mode === 'mcp') {
      // Always return a valid MCP result with schemaVersion: 'v1'
      return {
        output: {
          tool: input.toolName,
          payload: input.payload,
          context: input.context || null,
          note: 'Stub: No actual MCP call performed.',
          schemaVersion: '1.0', // Must match UniversalConfigurationPackageFormatV1
          scraper: {
            tool_id: 'playwright_v1',
            parameters: {
              selectors: { title: 'h1' },
              attribute: 'text'
            }
          },
          expectedOutputSchema: {
            type: 'object',
            properties: { title: { type: 'string', description: 'Page title' } },
            required: ['title']
          },
        },
        error: undefined,
        mode,
        durationMs: 1
      };
    }
    // Fallback for other modes
    return { output: null, error: 'Not implemented', mode, durationMs: 1 };
  }
};
import { OpenaiService } from '../dist/infrastructure/llm/openai.service.js';

const buildRepository = { updateBuildStatus: vi.fn() };
const toolbox = { listTools: vi.fn(() => [{ toolId: 'playwright_v1' }, { toolId: 'cheerio_parser_v2' }]) };
const openaiService = { generateInitialPackage: vi.fn() };
const orchestrator = testMcpOrchestrator;

const baseInput = {
  buildId: 'test-build',
  userObjective: 'Scrape titles',
  targetUrls: ['https://example.com']
};

describe('AnalysisService MCP Mode', () => {
  it('should use orchestrator MCP mode and return MCP stub package', async () => {
    // Set orchestration mode to MCP
    process.env.TOOL_ORCHESTRATION_MODE = 'mcp';
    // Use the real implementation, not a patched stub
    const service = new AnalysisService(buildRepository as any, toolbox as any, openaiService as any, orchestrator);
    const result = await service.analyzeBuildRequest(baseInput);
    expect(result.success).toBe(true);
    // Defensive: result.package should exist if success is true
    expect(result.package).toBeDefined();
    if (result.package) {
      expect(result.package).toHaveProperty('tool', 'playwright_v1');
      // The stub MCPClient returns a note containing 'MCP'
      expect(result.package.note).toContain('MCP');
    }
  });

  it('should handle MCP failure and return error', async () => {
    process.env.TOOL_ORCHESTRATION_MODE = 'mcp';
    const service = new AnalysisService(buildRepository as any, toolbox as any, openaiService as any, orchestrator);
    // Simulate MCP failure by using a stub orchestrator that returns an error
    const failOrchestrator = {
      async callTool(input: any, mode: string) {
        return { output: null, error: 'Simulated MCP failure', mode, durationMs: 1 };
      }
    };
    const failService = new AnalysisService(buildRepository as any, toolbox as any, openaiService as any, failOrchestrator);
    const failInput = { ...baseInput, userObjective: 'fail', targetUrls: ['https://example.com'] };
    const result = await failService.analyzeBuildRequest({ ...failInput });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Simulated MCP failure');
  });

  // Add more cases as needed for dual mode, fallback, etc.
});

