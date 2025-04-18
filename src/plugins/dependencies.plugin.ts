// src/plugins/dependencies.plugin.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyInstance } from 'fastify';

// Extend FastifyInstance with our decorations
declare module 'fastify' {
  interface FastifyInstance {
    mcpService: McpService;
    buildRepository: BuildRepository;
    toolboxService: ToolboxService;
    executionEngine: ExecutionEngineService;
    fullScrapeService: FullScrapeExecutionService;
    executionService: FullScrapeExecutionService; // Adding alias for fullScrapeService
    analysisService: AnalysisService;
  }
}
import { McpService } from '../mcp-server/mcp.service.js';
import { ExecutionEngineService } from '../infrastructure/execution/execution.service.js';
import { FullScrapeExecutionService } from '../infrastructure/execution/full-scrape.service.js';
import { BuildRepository } from '../infrastructure/db/build.repository.js';
import { ToolboxService } from '../infrastructure/toolbox/toolbox.service.js';
import { AnalysisService } from '../modules/analysis/analysis.service.js';
import { createOpenaiService } from '../infrastructure/llm/fastify-openai.service.js';
import { OpenaiService } from '../infrastructure/llm/openai.service.js';
import { UnifiedOrchestrator } from '../orchestrator/orchestrator.interface.js';

// Import other services if needed, e.g.:
// import { AnotherService } from '../services/another.service.js';

/**
 * This plugin instantiates and decorates application-wide services (dependencies).
 */
const dependenciesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.log.info('Registering dependencies plugin...');

  // --- McpService --- 
  try {
    // Instantiate McpService with the logger
    const mcpServiceInstance = new McpService(fastify.log);
    // Decorate the instance onto Fastify
    fastify.decorate('mcpService', mcpServiceInstance);
    fastify.log.info('McpService decorated successfully.');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to instantiate or decorate McpService.');
    // Decide if the application can proceed without this service
    throw new Error('McpService initialization failed.'); 
  }
  
  // --- Build Repository ---
  try {
    // Instantiate BuildRepository with PrismaClient
    const buildRepository = new BuildRepository(fastify.prisma);
    // Decorate the instance onto Fastify
    fastify.decorate('buildRepository', buildRepository);
    fastify.log.info('BuildRepository decorated successfully.');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to instantiate or decorate BuildRepository.');
    throw new Error('BuildRepository initialization failed.');
  }
  
  // --- Toolbox Service ---
  try {
    // Instantiate ToolboxService
    const toolboxService = new ToolboxService();
    // Decorate the instance onto Fastify
    fastify.decorate('toolboxService', toolboxService);
    fastify.log.info('ToolboxService decorated successfully.');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to instantiate or decorate ToolboxService.');
    throw new Error('ToolboxService initialization failed.');
  }
  
  // --- Execution Engine Service ---
  try {
    // Get toolbox from toolboxService
    const toolbox = fastify.toolboxService.getToolbox();
    // Instantiate ExecutionEngineService
    const executionEngine = new ExecutionEngineService(toolbox, fastify.toolboxService);
    // Decorate the instance onto Fastify
    fastify.decorate('executionEngine', executionEngine);
    fastify.log.info('ExecutionEngineService decorated successfully.');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to instantiate or decorate ExecutionEngineService.');
    throw new Error('ExecutionEngineService initialization failed.');
  }
  
  // --- Full Scrape Execution Service ---
  try {
    // Instantiate FullScrapeExecutionService
    const fullScrapeService = new FullScrapeExecutionService(
      fastify.executionEngine,
      fastify.buildRepository,
      fastify.prisma
    );
    // Decorate the instance onto Fastify
    fastify.decorate('fullScrapeService', fullScrapeService);
    // Also decorate as executionService for backward compatibility
    fastify.decorate('executionService', fullScrapeService);
    fastify.log.info('FullScrapeExecutionService decorated successfully (also as executionService)');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to instantiate or decorate FullScrapeExecutionService.');
    throw new Error('FullScrapeExecutionService initialization failed.');
  }

  // --- OpenAI Service ---
  let openaiService: OpenaiService;
  try {
    // Use the factory function to create a compatible OpenaiService
    openaiService = createOpenaiService(fastify.log, fastify.toolboxService);
    fastify.log.info('OpenaiService instantiated successfully');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to instantiate OpenaiService.');
    throw new Error('OpenaiService initialization failed.');
  }

  // --- Unified Orchestrator (optional) ---
  let orchestrator: UnifiedOrchestrator | undefined;
  if (process.env.TOOL_ORCHESTRATION_MODE && ['mcp', 'dual'].includes(process.env.TOOL_ORCHESTRATION_MODE)) {
    // Orchestrator implementation would go here if needed
    // This is just a placeholder - replace with actual implementation if required
    fastify.log.info('Unified Orchestrator support detected but not implemented.');
  }

  // --- Analysis Service ---
  try {
    // Get toolbox from toolboxService
    const toolbox = fastify.toolboxService.getToolbox();
    // Instantiate AnalysisService with dependencies
    const analysisService = new AnalysisService(
      fastify.buildRepository,
      toolbox,
      openaiService,
      orchestrator
    );
    // Decorate the instance onto Fastify
    fastify.decorate('analysisService', analysisService);
    fastify.log.info('AnalysisService decorated successfully.');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to instantiate or decorate AnalysisService.');
    throw new Error('AnalysisService initialization failed.');
  }

  fastify.log.info('Dependencies plugin registration complete.');
}

export default fp(dependenciesPlugin, {
  name: 'dependencies-plugin'
  // Specify dependencies of this plugin itself, if any
  // dependencies: ['some-other-base-plugin'] 
});
