import Fastify, { FastifyInstance } from 'fastify';
import autoload from '@fastify/autoload';
import { fileURLToPath } from 'url';
import path from 'path';
import sensible from '@fastify/sensible';
import dbPlugin from './plugins/db.plugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true, // Or configure based on environment
  });

  // Register essential plugins first
  await app.register(sensible); // Register sensible for error handling
  await app.register(dbPlugin);

  // Autoload OTHER plugins (if any)
  await app.register(autoload, {
    dir: path.join(__dirname, 'plugins'),
    options: { /* options for plugins */ },
    ignorePattern: /.*db.plugin\.(js|ts)$/,
    dirNameRoutePrefix: false,
  });

  // Autoload routes from modules
  await app.register(autoload, {
    dir: path.join(__dirname, 'modules'),
    options: { prefix: '/api/v1' }, // Set API prefix
    dirNameRoutePrefix: (folderName) => folderName, // e.g., /api/v1/builds
    ignorePattern: /.*(schema|types|repository|service)\.(js|ts)$/, // Ignore non-route files
  });

  return app;
}
