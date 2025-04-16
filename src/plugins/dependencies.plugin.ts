// src/plugins/dependencies.plugin.ts
import fp from 'fastify-plugin';
import type { FastifyInstance } from '../types/fastify.js'; // Use augmented types
import { McpService } from '../mcp-server/mcp.service.js';

// Import other services if needed, e.g.:
// import { AnotherService } from '../services/another.service.js';

/**
 * This plugin instantiates and decorates application-wide services (dependencies).
 */
async function dependenciesPlugin(fastify: FastifyInstance): Promise<void> {
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
