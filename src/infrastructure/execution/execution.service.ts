import { UniversalConfigurationPackageFormatV1 } from '../../core/domain/configuration-package.types.js';
import { ITool, IScraperTool, IAuxiliaryTool, ToolExecutionResult, IProxyManagerTool, IAntiBlockingTool } from './tool.interface.js';
import { IToolbox } from '../../core/interfaces/toolbox.interface.js';

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
  private instantiatedTools: ITool[] = []; // Track initialized tools for cleanup

  // 1. Add constructor to accept IToolbox
  constructor(toolbox: IToolbox) {
    if (!toolbox) {
        throw new Error("ExecutionEngineService requires a valid IToolbox instance.");
    }
    this.toolbox = toolbox;
  }

  async executePackage(
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

  // 3. Add cleanupTools method
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
