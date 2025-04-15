import Fastify from 'fastify';
import { FastifyInstance } from 'fastify';
import sensible from 'fastify-sensible'; // Import the plugin

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  // Register sensible plugin
  app.register(sensible);

  app.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
          required: ['status'],
        },
      },
    },
    handler: async (request, reply) => {
      return { status: 'ok' };
    },
  });

  // Register builds routes
  import('./modules/builds/builds.controller').then(({ buildsRoutes }) => {
    buildsRoutes(app);
  });

  return app;
}
