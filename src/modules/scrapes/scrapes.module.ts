/**
 * Scrapes Module
 * 
 * Registers all scrape-related routes and dependencies
 */

import { FastifyPluginAsync } from 'fastify';
import fullScrapeController from './full-scrape.controller.js';
import interactiveScrapeController from './interactive-scrape.controller.js';

const scrapesModule: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Register routes
  await fastify.register(fullScrapeController, { prefix: '/scrapes' });
  
  // Register interactive scrape controller
  // This implements the full user flow for interactive scraping with
  // knowledge base search, proposal generation, sample extraction, and refinement
  await fastify.register(interactiveScrapeController, { prefix: '/interactive-scrapes' });
};

export default scrapesModule;
