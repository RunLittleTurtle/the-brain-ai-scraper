import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

// In-memory build storage (replace with DB later)
const builds: Record<string, any> = {};

// Simple API key check middleware
function apiKeyAuth(request: FastifyRequest, reply: FastifyReply, done: () => void) {
  const authHeader = request.headers.authorization; // Fastify normalizes to lowercase
  const expectedKey = process.env.API_KEY;
  let apiKey: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7); // Extract token after "Bearer "
  }

  // Log for debugging
  console.log('Received Authorization header:', authHeader, '| Extracted Key:', apiKey, '| Expected:', expectedKey);

  if (apiKey !== expectedKey) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }
  done();
}

export async function buildsRoutes(app: FastifyInstance) {
  app.post('/builds', {
    preHandler: apiKeyAuth,
    schema: {
      body: {
        type: 'object',
        required: ['target_urls', 'user_objective'],
        properties: {
          target_urls: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
            minItems: 1,
          },
          user_objective: { type: 'string', minLength: 1 },
        },
      },
      response: {
        202: {
          type: 'object',
          properties: {
            build_id: { type: 'string' },
            status: { type: 'string' },
          },
          required: ['build_id', 'status'],
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    handler: async (request, reply) => {
      const { target_urls, user_objective } = request.body as any;
      // Additional validation if needed
      if (!Array.isArray(target_urls) || target_urls.length === 0 || !user_objective) {
        return reply.status(400).send({ error: 'Invalid payload' });
      }
      // Generate build_id
      const build_id = randomUUID();
      builds[build_id] = {
        build_id,
        target_urls,
        user_objective,
        status: 'pending_analysis',
        created_at: new Date().toISOString(),
      };
      // Stub: Trigger async LLM analysis (to be implemented)
      // ...
      return reply.status(202).send({ build_id, status: 'pending_analysis' });
    },
  });

  // Handle unsupported methods on /builds route
  app.route({
    method: ['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'], // Add other methods as needed
    url: '/builds',
    preHandler: apiKeyAuth, // Keep authentication for consistency
    handler: async (request, reply) => {
      reply.methodNotAllowed(); // Use sensible's helper
    },
  });
}
