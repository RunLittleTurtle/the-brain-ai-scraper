import Fastify from 'fastify'; // Import Fastify constructor
import type { FastifyInstance, FastifyRequest, FastifyReply } from './types/fastify.js'; // Import our augmented types
import dbPlugin from './plugins/db.plugin.js';
import getBuildStatusHandler from './modules/builds/get-build-status.handler.js'; // Use default import
import buildsController from './modules/builds/builds.controller.js'; // Use default import
import mcpPlugin from './mcp-server/mcp.plugin.js'; // Import MCP Plugin
import { apiKeyAuth } from './hooks/apiKeyAuth.js'; // Import hook
import dependenciesPlugin from './plugins/dependencies.plugin.js'; // Ensure .js

// Add explicit type import for sensible options
import type { SensiblePluginOptions } from '@fastify/sensible';

// Environment configuration (Consider using a dedicated config loader later)
const API_KEY = process.env.API_KEY;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Type definition for buildApp options (optional but good practice)
interface BuildAppOptions {
  apiKey?: string;
  logLevel?: string;
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ // Use imported Fastify constructor
    logger: {
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
  const sensible = await import('@fastify/sensible');
  await app.register(sensible.default); // Register sensible for useful decorators
  await app.register(dbPlugin); // Register DB plugin
  await app.register(dependenciesPlugin); // Register custom dependencies

  // Register routes requiring authentication under a prefixed scope
  await app.register(async (instance: FastifyInstance) => { // Explicitly type instance
    instance.addHook('onRequest', apiKeyAuth); // Apply auth hook to this scope
    // Register routes that require auth under this scope
    await instance.register(buildsController, { prefix: '/builds' });
    await instance.register(getBuildStatusHandler, { prefix: '/builds' }); // This handles GET /builds/:build_id
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

  return app;
}
