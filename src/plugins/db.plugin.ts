import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyInstance } from 'fastify';
import { PrismaClient } from '../generated/prisma/index.js'; // Adjust path if needed

// Extend FastifyInstance with the prisma client
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// Export the fp-wrapped plugin directly
export default fp<Record<string, any>>(async (server: FastifyInstance, options: Record<string, any>) => {
  const prisma = new PrismaClient({
    // Optional: Add logging configuration if needed
    // log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Optional: Test connection on startup
    // await prisma.$connect();
    // server.log.info('Prisma client connected successfully.');
  } catch (error) {
    server.log.error('Failed to connect Prisma client:', error);
    // Optionally, you might want to throw the error to prevent server startup
    // throw error;
  }

  // Make Prisma Client available through the fastify instance
  server.decorate('prisma', prisma);

  // Add hook to disconnect Prisma Client when the server closes
  server.addHook('onClose', async (instance: FastifyInstance) => {
    instance.log.info('Disconnecting Prisma client...');
    await instance.prisma.$disconnect();
    instance.log.info('Prisma client disconnected.');
  });
}, { 
  fastify: '>=4.x', // Specify Fastify version compatibility
  name: 'prisma-plugin' // Optional but good practice plugin name 
});
