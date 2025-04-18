import fp from 'fastify-plugin';
// Always use the custom FastifyInstance type for plugin typing
import type { FastifyPluginAsync } from '../types/fastify.js';
import type { FastifyInstance as BaseFastifyInstance } from 'fastify'; // Use base type for plugins that do not require custom decorations
import { PrismaClient } from '../generated/prisma/index.js';

// Extend FastifyInstance with the prisma client
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// Define options with a potential prisma client for testing
interface DbPluginOptions {
  prisma?: PrismaClient;
}

// Define the plugin using FastifyPluginAsync type
// Use the base FastifyInstance for plugins that do not require mcpService
const dbPlugin: FastifyPluginAsync = async (server: BaseFastifyInstance, options: DbPluginOptions) => {
  // Allow injection of an existing Prisma client (useful for testing)
  const prisma = options.prisma || new PrismaClient({
    // Optionally configure logging
    // log: [ { emit: 'event', level: 'query' }, 'info', 'warn', 'error'],
  });

  // Optional: Log Prisma queries (can be verbose)
  // prisma.$on('query', (e) => {
  //   server.log.debug({ query: e.query, params: e.params, duration: e.duration }, 'Prisma query');
  // });

  try {
    await prisma.$connect();
    // Use server.log
    server.log.info('Prisma client connected successfully.');

    // Decorate the Fastify instance with the Prisma client
    // Use server.decorate
    server.decorate('prisma', prisma);

    // Add a hook to disconnect Prisma when the server closes
    // Use server.addHook
    server.addHook('onClose', async (instance: BaseFastifyInstance) => {
      // Use instance.log inside the hook
      instance.log.info('Disconnecting Prisma client...');
      await instance.prisma.$disconnect();
      instance.log.info('Prisma client disconnected.');
    });

  } catch (error) {
    // Use server.log for errors during connection
    server.log.error({ err: error }, 'Failed to connect Prisma client during plugin setup');
    // Propagate the error to stop Fastify from starting if DB connection fails
    throw error;
  }
};

// Export the plugin using fastify-plugin to avoid encapsulation issues
export default fp(dbPlugin, { 
  fastify: '>=4.x', // Specify Fastify version compatibility
  name: 'prisma-plugin' // Optional but good practice plugin name 
});
