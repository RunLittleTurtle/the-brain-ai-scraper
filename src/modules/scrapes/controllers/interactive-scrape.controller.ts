/**
 * Interactive Scrape Controller
 * 
 * Integrates all the modular controllers for the interactive scraping workflow:
 * 1. User submits request
 * 2. System searches knowledge base
 * 3. System proposes approach
 * 4. User reviews proposal
 * 5. System generates samples
 * 6. User reviews samples
 * 7. System refines (if needed)
 * 8. System performs full extraction
 */

import { PrismaClient } from '../../../generated/prisma/index.js';
import { BuildRepository } from '../../../infrastructure/db/build.repository.js';
import { AnalysisService } from '../../analysis/analysis.service.js';
import { FullScrapeExecutionService } from '../../../infrastructure/execution/full-scrape.service.js';
import { 
  createProcessors,
  BuildAnalysisProcessor,
  SampleGenerationProcessor,
  RefinementProcessor,
  ExecutionProcessor
} from '../../../jobs/processors/index.js';

import {
  CreateScrapeController,
  StatusController,
  ProposalFeedbackController,
  SampleFeedbackController,
  ResultsController
} from './index.js';

import type { FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import type { FastifyInstance as BaseFastifyInstance } from 'fastify';

/**
 * Interactive scrape controller plugin
 */
const interactiveScrapeController: FastifyPluginAsync = async (
  fastify: BaseFastifyInstance,
  opts: FastifyPluginOptions
) => {
  // Get the dependencies from fastify
  const prisma = fastify.prisma as PrismaClient;
  const analysisService = fastify.analysisService as AnalysisService;
  const executionService = fastify.executionService as FullScrapeExecutionService;
  
  // Create the build repository
  const buildRepository = new BuildRepository(prisma);
  
  // Create the processors
  const processors = createProcessors(
    buildRepository,
    analysisService,
    executionService,
    prisma
  );
  
  // Extract individual processors for clarity
  const { 
    analysisProcessor, 
    sampleProcessor, 
    refinementProcessor, 
    executionProcessor 
  } = processors;

  // Create controllers
  const createScrapeController = new CreateScrapeController(
    buildRepository,
    analysisProcessor
  );
  
  const statusController = new StatusController(
    buildRepository,
    executionService
  );
  
  const proposalFeedbackController = new ProposalFeedbackController(
    buildRepository,
    refinementProcessor,
    sampleProcessor
  );
  
  const sampleFeedbackController = new SampleFeedbackController(
    buildRepository,
    refinementProcessor
  );
  
  const resultsController = new ResultsController(
    buildRepository,
    prisma
  );

  // Register all routes from the controllers
  createScrapeController.registerRoutes(fastify);
  statusController.registerRoutes(fastify);
  proposalFeedbackController.registerRoutes(fastify);
  sampleFeedbackController.registerRoutes(fastify);
  resultsController.registerRoutes(fastify);
};

export default interactiveScrapeController;
