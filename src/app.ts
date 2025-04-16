import Fastify, { FastifyInstance as BaseFastifyInstance, FastifyServerOptions } from 'fastify'; // Import Fastify constructor AND Base Instance AND ServerOptions
import type { FastifyInstance, FastifyRequest, FastifyReply } from './types/fastify.js'; // Import our augmented types
import dbPlugin from './plugins/db.plugin.js';
import sensible from '@fastify/sensible'; // Import @fastify/sensible
import buildsController from './modules/builds/builds.controller.js'; // Use default import
import mcpPlugin from './mcp-server/mcp.plugin.js'; // Import MCP Plugin
import { apiKeyAuth } from './hooks/apiKeyAuth.js'; // Import hook
import dependenciesPlugin from './plugins/dependencies.plugin.js'; // Ensure .js

// Environment configuration (Consider using a dedicated config loader later)
const API_KEY = process.env.API_KEY;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Type definition for buildApp options (optional but good practice)
interface BuildAppOptions {
  apiKey?: string;
  logLevel?: string;
  logger?: FastifyServerOptions['logger'] | boolean; // Add logger option
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ // Use imported Fastify constructor
    logger: opts.logger !== undefined ? opts.logger : { // Use logger from opts if provided, otherwise default
      level: opts.logLevel || LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
      },
    },
  });

  // Check for API Key at startup
  if (!opts.apiKey && !API_KEY) {
    app.log.error('API_KEY environment variable is not set. Application cannot start securely.');
    process.exit(1); // Exit if API key is missing
  }

  // Register essential plugins
  await app.register(dbPlugin); // Register DB plugin
  await app.register(sensible); // Register @fastify/sensible
  await app.register(dependenciesPlugin); // Register custom dependencies

  // Register routes requiring authentication under a prefixed scope
  await app.register(async (instance: BaseFastifyInstance) => { // Explicitly type instance
    // Register the apiKeyAuth hook using addHook for this scope
    instance.addHook('preHandler', apiKeyAuth); 
    
    // Register routes that require auth under this scope
    // These plugins should also ideally use BaseFastifyInstance in their signature
    await instance.register(buildsController, { prefix: '/builds' });
    await instance.register(mcpPlugin, { prefix: '/mcp' }); // Register MCP service routes
  });

  // Health check endpoint (does not require auth)
  app.get('/health', async (request: FastifyRequest, reply: FastifyReply) => { // Explicitly type request/reply
    try {
      // Optional: Check DB connection
      await app.prisma.$queryRaw`SELECT 1`;
      return reply.status(200).send({ status: 'ok', db: 'connected' });
    } catch (dbError) {
      app.log.error('Health check failed - DB connection error:', dbError);
      return reply.status(503).send({ status: 'error', db: 'disconnected' });
    }
  });

  // --- GLOBAL NOT FOUND HANDLER ---
  app.setNotFoundHandler((request, reply) => {
    app.log.warn('Not Found Handler triggered', { method: request.method, url: request.url });
    reply.status(404).send({ message: 'Route not found' });
  });

  // --- GLOBAL ERROR HANDLER ---
  app.setErrorHandler((error, request, reply) => {
    app.log.error({
      msg: 'Global Error Handler',
      error,
      stack: error?.stack,
      statusCode: error?.statusCode,
      validation: error?.validation,
      request: {
        method: request.method,
        url: request.url,
        params: request.params,
        body: request.body,
        headers: request.headers
      }
    });
    // Fastify validation error
    if (error.validation) {
      reply.status(400).send({ message: 'Validation failed', errors: error.validation });
    } else if (error.statusCode === 404) {
      reply.status(404).send({ message: error.message || 'Resource not found' }); // Use error message if available
    } else {
      reply.status(error.statusCode || 500).send({ message: error.message || 'Internal server error' }); // Use status code/message
    }
  });

  // Cast to unknown first, then to custom FastifyInstance (with mcpService). This is safe after all plugins registered.
  return app as unknown as FastifyInstance;
}
