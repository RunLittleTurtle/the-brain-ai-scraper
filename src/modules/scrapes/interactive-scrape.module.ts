/**
 * Interactive Scrape Module - Registers the interactive scrape routes
 */
import { FastifyPluginCallback } from 'fastify';
import interactiveScrapeController from './controllers/interactive-scrape.controller.js';

const interactiveScrapeModule: FastifyPluginCallback = async (fastify, opts) => {
  // Register the controller to set up routes
  await fastify.register(interactiveScrapeController, { prefix: '/api/v1' });
};

export default interactiveScrapeModule;
