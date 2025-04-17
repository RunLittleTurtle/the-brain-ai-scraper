import Fastify, { FastifyInstance as BaseFastifyInstance, FastifyServerOptions, FastifyError } from 'fastify'; // Import Fastify constructor AND Base Instance AND ServerOptions
import type { FastifyInstance, FastifyRequest, FastifyReply } from './types/fastify.js'; // Import our augmented types
import dbPlugin from './plugins/db.plugin.js';
import sensible from '@fastify/sensible'; // Import @fastify/sensible
import buildsController from './modules/builds/builds.controller.js'; // Use default import
import runsController from './modules/runs/runs.controller.js'; // Register runs endpoint
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
  const app = Fastify({
    logger: opts.logger !== undefined ? opts.logger : {
      level: opts.logLevel || LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
      },
    },
    ajv: {
      customOptions: {
        allErrors: true
      }
    }
  });

  // Check for API Key at startup
  if (!opts.apiKey && !API_KEY) {
    app.log.error('API_KEY environment variable is not set. Application cannot start securely.');
    process.exit(1); // Exit if API key is missing
  }

  // Decorate Fastify with config object for API key access in hooks
  app.decorate('config', { apiKey: opts.apiKey || API_KEY });

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
    await instance.register(runsController, { prefix: '/runs' }); // Register new runs endpoint
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
    // Debug log to confirm error handler is called
    app.log.warn('IN ERROR HANDLER', { errorName: error.name, hasValidation: !!error.validation, statusCode: error.statusCode });

    // Handle validation errors (rely only on standard error.validation)
    if (error.validation) {
      // Ensure validation errors are properly formatted as an array
      const formattedErrors = Array.isArray(error.validation) ? error.validation : [];
      reply.status(400).send({
        run_id: '', // No specific run_id available here
        message: 'Validation failed', // Generic message
        errors: formattedErrors // Use the standard validation errors array
      });
      return;
    }

    // Handle other 400 errors (that are not validation errors)
    if (error.statusCode === 400) {
      reply.status(400).send({
        run_id: (error as any).run_id || '', // Try to get run_id if attached by other code
        message: typeof error.message === 'string' ? error.message : 'Bad request',
        errors: [] // No validation errors here, send empty array
      });
      return;
    }

    // Handle other errors (e.g., 500)
    if (error.statusCode === 404) {
      reply.status(404).send({ message: error.message || 'Resource not found' }); // Use error message if available
      return;
    }
    // Default
    reply.status(error.statusCode || 500).send({ message: error.message || 'Internal server error' });
  });

  // Cast to unknown first, then to custom FastifyInstance (with mcpService). This is safe after all plugins registered.
  return app as unknown as FastifyInstance;
}
