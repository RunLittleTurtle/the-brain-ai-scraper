// Import augmented Fastify types from our local definition file
import type {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply
} from '../types/fastify.js';
import fp from 'fastify-plugin';
import { McpToolDefinition, McpInvokePayload } from './mcp-types.js';
import { McpService } from './mcp.service.js';
import { z } from 'zod';
import { NotFoundError, InternalServerError } from '../core/errors/index.js';

// REMOVE: Augmentation block is now in src/types/fastify.d.ts
/*
declare module 'fastify' {
  interface FastifyInstance {
    mcpService: McpService; // Declare the decorated service
  }
}
*/

// Type for plugin options (if any) - Can keep this if specific options are needed
interface McpPluginOptions extends FastifyPluginOptions {
  // Add any specific options for this plugin
}

// Define the plugin implementation using our augmented types
const mcpPluginImpl = async (
    fastifyInstance: FastifyInstance,
    options: McpPluginOptions
): Promise<void> => {
  const logger = fastifyInstance.log.child({ plugin: 'MCP' });
  logger.info('Registering MCP Plugin...');

  // Ensure McpService is available
  if (!fastifyInstance.mcpService) {
    logger.error('McpService not found. Ensure dependencies-plugin is registered before mcp-plugin.');
    throw new Error('McpService dependency not met.');
  }
  const mcpService = fastifyInstance.mcpService;

  // Register routes
  fastifyInstance.get('/mcp/tools', async (request: FastifyRequest, reply: FastifyReply) => {
    logger.info('Received GET /mcp/tools request');
    try {
      const tools: McpToolDefinition[] = mcpService.listTools();
      reply.code(200).send(tools);
    } catch (error: any) {
      logger.error({ err: error }, 'Error handling GET /mcp/tools');
      reply.code(500).send(new InternalServerError('Failed to list MCP tools.'));
    }
  });

  fastifyInstance.post('/mcp/invoke',
    async (request: FastifyRequest<{ Body: McpInvokePayload }>, reply: FastifyReply) => {
      const payload = request.body;
      logger.info({ payload }, 'Received POST /mcp/invoke request');
      try {
        const result = await mcpService.invokeTool(payload);
        reply.code(200).send(result);
      } catch (error: any) {
        logger.error({ err: error, payload }, 'Error handling POST /mcp/invoke');
        if (error instanceof NotFoundError) {
          reply.code(404).send(error);
        } else {
          reply.code(500).send(new InternalServerError('Failed to invoke MCP tool.'));
        }
      }
    }
  );

  logger.info('MCP Plugin registered successfully.');
};

// Cast the implementation to the expected plugin type before wrapping with fp
export default fp(mcpPluginImpl as FastifyPluginAsync<McpPluginOptions>, {
  name: 'mcp-plugin',
  dependencies: ['dependencies-plugin']
});
