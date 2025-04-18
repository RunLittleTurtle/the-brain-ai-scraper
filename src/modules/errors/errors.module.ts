/**
 * Error Reporting Module
 * 
 * Registers all error reporting related routes and dependencies
 */

import { FastifyPluginAsync } from 'fastify';
import errorsController from './errors.controller.js';

const errorsModule: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Register routes
  await fastify.register(errorsController, { prefix: '/api' });
};

export default errorsModule;
