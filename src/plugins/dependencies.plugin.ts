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
  }
}
import { McpService } from '../mcp-server/mcp.service.js';
import { ExecutionEngineService } from '../infrastructure/execution/execution.service.js';
import { FullScrapeExecutionService } from '../infrastructure/execution/full-scrape.service.js';
import { BuildRepository } from '../infrastructure/db/build.repository.js';
import { ToolboxService } from '../infrastructure/toolbox/toolbox.service.js';

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
    fastify.log.info('FullScrapeExecutionService decorated successfully.');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to instantiate or decorate FullScrapeExecutionService.');
    throw new Error('FullScrapeExecutionService initialization failed.');
  }

  // --- Decorate other services here --- 
  // Example:
  // const anotherServiceInstance = new AnotherService(fastify.log);
  // fastify.decorate('anotherService', anotherServiceInstance);
  // fastify.log.info('AnotherService decorated successfully.');

  fastify.log.info('Dependencies plugin registration complete.');
}

export default fp(dependenciesPlugin, {
  name: 'dependencies-plugin'
  // Specify dependencies of this plugin itself, if any
  // dependencies: ['some-other-base-plugin'] 
});
