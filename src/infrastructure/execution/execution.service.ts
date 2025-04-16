import { UniversalConfigurationPackageFormatV1 } from '../../core/domain/configuration-package.types.js';
import { ITool, IScraperTool, IAuxiliaryTool, ToolExecutionResult, IProxyManagerTool, IAntiBlockingTool } from './tool.interface.js';
import { IToolbox } from '../../core/interfaces/toolbox.interface.js';
import { ToolboxService } from '../toolbox/toolbox.service.js';
import { NotFoundError, InternalServerError } from '../../core/errors/index.js'; // Corrected path
import { performance } from 'perf_hooks';

// --- Configuration --- TODO: Move to config file/env vars
const TOOL_ORCHESTRATION_MODE = process.env.TOOL_ORCHESTRATION_MODE || 'classic'; // 'classic', 'mcp', 'dual'

/**
 * Represents the aggregated result of executing a configuration package
 * against a list of target URLs.
 */
export interface ExecutionResult {
  overallStatus: 'completed' | 'partial_success' | 'failed';
  results: ToolExecutionResult[]; // Use ToolExecutionResult from tool.interface
  error?: string; // Overall error message if the execution failed catastrophically
}

/**
 * Service responsible for executing a configuration package.
 * It retrieves tools from the Toolbox, initializes them, runs them against target URLs,
 * and aggregates the results.
 */
export class ExecutionEngineService {
  private toolbox: IToolbox; // Store the toolbox instance
  private toolboxService: ToolboxService; // Store the toolbox service instance
  private instantiatedTools: ITool[] = []; // Track initialized tools for cleanup

  // 1. Add constructor to accept IToolbox and ToolboxService
  constructor(toolbox: IToolbox, toolboxService: ToolboxService) {
    if (!toolbox) {
        throw new Error("ExecutionEngineService requires a valid IToolbox instance.");
    }
    if (!toolboxService) {
        throw new Error("ExecutionEngineService requires a valid ToolboxService instance.");
    }
    this.toolbox = toolbox;
    this.toolboxService = toolboxService;
  }

  async executePackage(
    configPackage: UniversalConfigurationPackageFormatV1,
    targetUrls: string[],
  ): Promise<ExecutionResult> {
    // --- Orchestration Mode Selection ---
    const mode = (process.env.TOOL_ORCHESTRATION_MODE || 'classic').toLowerCase();
    console.log(`[ExecutionEngine] Orchestration mode: ${mode}`);

    if (mode === 'classic') {
      return this.executeClassic(configPackage, targetUrls);
    } else if (mode === 'mcp') {
      return this.executeMcp(configPackage, targetUrls);
    } else if (mode === 'dual') {
      return this.executeDual(configPackage, targetUrls);
    } else {
      console.error(`[ExecutionEngine] Invalid TOOL_ORCHESTRATION_MODE: ${mode}. Falling back to classic.`);
      return this.executeClassic(configPackage, targetUrls);
    }
  }

  // --- Classic (existing) execution logic ---
  private async executeClassic(
    configPackage: UniversalConfigurationPackageFormatV1,
    targetUrls: string[],
  ): Promise<ExecutionResult> {
    // Reset instantiated tools for this run
    this.instantiatedTools = [];
    const aggregatedResults: ToolExecutionResult[] = [];
    let overallStatus: ExecutionResult['overallStatus'] = 'completed'; // Optimistic start
    let scraperTool: IScraperTool | undefined;
    // Auxiliary tools array is now just local to this method
    // const auxiliaryTools: IAuxiliaryTool[] = []; // Keep track for cleanup

    // --- Context for scraper ---
    // This will be populated by auxiliary tools if they exist
    let executionContext = {}; 

    try {
      // --- 1. Get and Initialize Scraper Tool ---
      const scraperConfig = configPackage.scraper;
      if (!scraperConfig || !scraperConfig.tool_id) {
        throw new Error('Configuration package is missing scraper tool definition.');
      }

      console.log(`[ExecutionEngine] Attempting to get scraper tool: ${scraperConfig.tool_id}`);
      // Use this.toolbox instead of imported singleton
      const scraperToolInstance = await this.toolbox.getTool(scraperConfig.tool_id);

      // *** Start Diagnostics ***
      console.log('[ExecutionEngine] Retrieved scraper tool instance:', scraperToolInstance);
      console.log(`[ExecutionEngine] Type of scraperToolInstance: ${typeof scraperToolInstance}`);
      if (scraperToolInstance) {
          console.log(`[ExecutionEngine] scraperToolInstance constructor name: ${scraperToolInstance.constructor?.name}`);
          console.log(`[ExecutionEngine] Does scraperToolInstance have 'initialize'? ${'initialize' in scraperToolInstance}`);
          const initializeType = typeof (scraperToolInstance as any).initialize;
          console.log(`[ExecutionEngine] Type of scraperToolInstance.initialize: ${initializeType}`);
      }
      // *** End Diagnostics ***

      if (!scraperToolInstance) {
        throw new Error(`Scraper tool with ID '${scraperConfig.tool_id}' not found in toolbox.`);
      }

      // Explicit Check before calling
      if (typeof (scraperToolInstance as any).initialize !== 'function') {
          console.error("[ExecutionEngine] CRITICAL: scraperToolInstance.initialize is NOT a function!", scraperToolInstance);
          throw new TypeError("Retrieved scraper tool object does not have a callable 'initialize' method.");
      }

      console.log(`[ExecutionEngine] Initializing scraper tool: ${scraperConfig.tool_id}`);
      await scraperToolInstance.initialize(scraperConfig);
      this.instantiatedTools.push(scraperToolInstance); // Track for cleanup
      console.log(`[ExecutionEngine] Scraper tool initialized successfully.`);

      // Type assertion via unknown needed if getTool returns base ITool
      scraperTool = scraperToolInstance as unknown as IScraperTool;

      // --- 2. Get and Initialize Auxiliary Tools (Proxy, Anti-blocking, etc.) ---
      const toolConfigsToInitialize = [ 
          configPackage.proxy,
          ...(configPackage.antiBlocking || []),
          configPackage.captchaSolver
      ].filter(config => !!config); // Filter out undefined configs

      for (const auxConfig of toolConfigsToInitialize) {
          if (auxConfig && auxConfig.tool_id) {
              // Use this.toolbox
              const foundAuxTool = await this.toolbox.getTool(auxConfig.tool_id);
              if (!foundAuxTool) {
                  console.warn(`[ExecutionEngine] Auxiliary tool with ID '${auxConfig.tool_id}' not found in Toolbox. Skipping.`);
                  continue;
              }
              // Type assertion via unknown needed if getTool returns base ITool
              const auxTool = foundAuxTool as unknown as IAuxiliaryTool;
              console.log(`[ExecutionEngine] Initializing auxiliary tool: ${auxTool.toolId}`);
              await auxTool.initialize(auxConfig);
              this.instantiatedTools.push(auxTool); // Track for cleanup

              // --- TODO P1/P2: Populate executionContext based on aux tool capabilities --- 
              // Example for proxy:
              // if ('getProxyForUrl' in auxTool) {
              //   executionContext.getProxy = (url) => (auxTool as IProxyManagerTool).getProxyForUrl(url);
              // }
              // Example for anti-blocking:
              // if ('applyStrategies' in auxTool) {
              //    // Apply strategies here or pass function in context
              // }
          }
      }

      // --- 3. Run Scraper Tool Against URLs ---
      console.log(`[ExecutionEngine] Executing scraper tool '${scraperTool.toolId}' against ${targetUrls.length} URLs.`);
      for (const targetUrl of targetUrls) {
        let result: ToolExecutionResult;
        try {
          // --- Pass the full package and potentially derived context --- 
          result = await scraperTool.execute(targetUrl, configPackage /*, executionContext */);
          aggregatedResults.push(result);
          if (!result.success) {
            overallStatus = 'partial_success'; // Mark as partial if any URL fails
            console.warn(`[ExecutionEngine] Tool '${scraperTool.toolId}' failed for URL ${targetUrl}: ${result.error}`);
          }
        } catch (runError: any) {
          // Catch errors thrown directly by the tool's execute method
          console.error(`[ExecutionEngine] Critical error running tool '${scraperTool.toolId}' on ${targetUrl}:`, runError);
          result = {
            success: false,
            error: runError.message || 'Unknown run error',
            // Consider adding stack trace or details if needed
          };
          aggregatedResults.push(result);
          overallStatus = 'partial_success';
        }
      }

      if (overallStatus === 'partial_success' && aggregatedResults.every(r => !r.success)) {
        overallStatus = 'failed'; // If ALL URLs failed, mark as failed
      }

      return { overallStatus, results: aggregatedResults };

    } catch (error: any) {
      // Catch errors during tool retrieval or initialization
      console.error('[ExecutionEngine] Failed to execute package:', error);
      return {
        overallStatus: 'failed',
        results: aggregatedResults, // Include any partial results if execution started
        error: error.message || 'Failed during tool initialization or retrieval',
      };
    } finally {
      // --- 4. Cleanup Tools ---
      // Removed cleanup logic from here
    }
  }

  // --- MCP execution logic ---
  private async executeMcp(
    configPackage: UniversalConfigurationPackageFormatV1,
    targetUrls: string[],
  ): Promise<ExecutionResult> {
    console.log(`[ExecutionEngine] Executing in MCP mode via ToolboxService.callTool`);
    const aggregatedResults: ToolExecutionResult[] = [];
    let overallStatus: ExecutionResult['overallStatus'] = 'completed';

    const scraperConfig = configPackage.scraper;
    if (!scraperConfig || !scraperConfig.tool_id) {
      return {
        overallStatus: 'failed',
        results: [],
        error: 'MCP Execution Failed: Configuration package is missing scraper tool definition.',
      };
    }

    const toolId = scraperConfig.tool_id;

    for (const targetUrl of targetUrls) {
      console.log(`[ExecutionEngine-MCP] Processing URL: ${targetUrl} with tool ${toolId}`);
      
      // Construct parameters for the specific tool call
      const toolParams = {
        ...(scraperConfig.parameters || {}), // Base parameters from the package
        targetUrl: targetUrl, // The specific URL for this execution
        // Potential TODO: How to pass auxiliary tool configs if needed by the tool implementation?
        // callTool might need enhancement, or tools need to access the full package.
        // For now, assume basic params + targetUrl is sufficient or handled within the tool.
        // We might need to pass the full 'configPackage' if tools require it.
        // Let's adjust toolboxService.callTool if this becomes necessary.
      };

      try {
        // Directly call the tool using the injected toolbox service
        const result: ToolExecutionResult = await this.toolboxService.callTool(toolId, toolParams);

        console.log(`[ExecutionEngine-MCP] Received result for ${targetUrl}: Success=${result.success}`);
        aggregatedResults.push(result);
        if (!result.success) {
          overallStatus = 'partial_success';
        }

      } catch (error: any) {
        console.error(`[ExecutionEngine-MCP] Error invoking tool ${toolId} via ToolboxService for ${targetUrl}:`, error);
        // Create a ToolExecutionResult compatible error structure
        aggregatedResults.push({
          success: false,
          error: `Toolbox invocation failed for ${toolId}: ${error.message || 'Unknown error'}`, 
          // data field is implicitly undefined
        });
        overallStatus = 'partial_success';
      }
    }

    if (overallStatus === 'partial_success' && aggregatedResults.every(r => !r.success)) {
      overallStatus = 'failed';
    }

    return { overallStatus, results: aggregatedResults };
  }

  // --- Dual (A/B Testing) execution logic ---
  private async executeDual(
    configPackage: UniversalConfigurationPackageFormatV1,
    targetUrls: string[],
  ): Promise<ExecutionResult> {
    console.log('[ExecutionEngine] Executing in Dual (A/B) mode...');
    const startTime = performance.now();

    const [classicResultSettled, mcpResultSettled] = await Promise.allSettled([
      this.executeClassic(configPackage, targetUrls),
      this.executeMcp(configPackage, targetUrls),
    ]);

    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`[ExecutionEngine-Dual] Total execution time: ${duration.toFixed(2)} ms`);

    // --- Log Comparison Results ---
    const logComparison = (mode: string, resultSettled: PromiseSettledResult<ExecutionResult>, otherModeStatus?: ExecutionResult['overallStatus']) => {
      if (resultSettled.status === 'fulfilled') {
        const result = resultSettled.value;
        const successCount = result.results.filter(r => r.success).length;
        console.log(`[ExecutionEngine-Dual] ${mode} Mode: Status=${result.overallStatus}, Successes=${successCount}/${targetUrls.length}, Error='${result.error || 'None'}'`);
        // Fallback logic check (optional)
        if (result.overallStatus === 'failed' && otherModeStatus && otherModeStatus !== 'failed') {
           console.log(`[ExecutionEngine-Dual] ${mode} Mode failed, but other mode (${otherModeStatus}) might have succeeded (Fallback Opportunity).`);
        }
        return result; // Return the result for primary return value decision
      } else {
        console.error(`[ExecutionEngine-Dual] ${mode} Mode CRASHED:`, resultSettled.reason);
        // Fallback logic check (optional)
         if (otherModeStatus && otherModeStatus !== 'failed') {
           console.log(`[ExecutionEngine-Dual] ${mode} Mode crashed, but other mode (${otherModeStatus}) might have succeeded (Fallback Opportunity).`);
         }
        return null; // Indicate crash
      }
    };

    const classicResult = logComparison('Classic', classicResultSettled);
    const mcpResult = logComparison('MCP', mcpResultSettled, classicResult?.overallStatus);

    // --- Determine Primary Result (Prioritize Classic for now) ---
    if (classicResult) {
        console.log('[ExecutionEngine-Dual] Returning results from Classic execution.');
        // Add performance log to the result if needed
        // classicResult.performance = { classicTimeMs: /* calculate */, mcpTimeMs: /* calculate */ };
        return classicResult;
    } else if (mcpResult) {
         // Fallback: If classic crashed but MCP succeeded, return MCP results
        console.warn('[ExecutionEngine-Dual] Classic execution crashed, falling back to MCP results.');
        return mcpResult;
    } else {
        // Dual crashed
        console.error('[ExecutionEngine-Dual] Both Classic and MCP execution failed catastrophically.');
        return {
            overallStatus: 'failed',
            results: [],
            error: 'Both Classic and MCP execution modes failed.',
        };
    }
  }

  // --- Cleanup Logic (Remains unchanged, handled by ToolboxService) ---
  async cleanupTools(): Promise<void> {
    console.log(`[ExecutionEngine] Cleaning up ${this.instantiatedTools.length} instantiated tools...`);
    for (const tool of this.instantiatedTools) {
      // Check if cleanup method exists and is a function
      if (tool && typeof tool.cleanup === 'function') {
        try {
          console.log(`[ExecutionEngine] Cleaning up tool: ${tool.toolId}`);
          await tool.cleanup();
        } catch (error: any) {
          console.error(`[ExecutionEngine] Error cleaning up tool ${tool.toolId}: ${error.message}`);
          // Continue cleanup even if one tool fails
        }
      } else {
          // Optional: Log if a tool doesn't have cleanup or isn't as expected
          // console.log(`[ExecutionEngine] Tool ${tool?.toolId || 'unknown'} has no cleanup method.`);
      }
    }
    this.instantiatedTools = []; // Reset the list after cleanup
    console.log('[ExecutionEngine] Tool cleanup finished.');
  }

} // End class ExecutionEngineService
