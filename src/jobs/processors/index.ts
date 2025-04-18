/**
 * Processors Module
 * 
 * Exports all processors and factory functions for creating processor instances
 */
import { PrismaClient } from '../../generated/prisma/index.js';
import { IBuildRepository } from '../../infrastructure/db/build.repository.js';
import { AnalysisService } from '../../modules/analysis/analysis.service.js';
import { ExecutionEngineService } from '../../infrastructure/execution/execution.service.js';

// Import all processor classes
import { BaseProcessor } from './base.processor.js';
import { BuildAnalysisProcessor } from './build-analysis.processor.js';
import { SampleGenerationProcessor } from './sample-generation.processor.js';
import { RefinementProcessor, FeedbackType } from './refinement.processor.js';
import { ExecutionProcessor } from './execution.processor.js';

// Export all processor classes
export { BaseProcessor };
export { BuildAnalysisProcessor };
export { SampleGenerationProcessor };
export { RefinementProcessor, FeedbackType };
export { ExecutionProcessor };

// Re-export TypeScript types
export type { IBuildRepository };

/**
 * Create a fully initialized processor system with proper dependency injection
 * 
 * @param buildRepository Repository for build data
 * @param analysisService Service for LLM-based analysis
 * @param executionEngine Service for executing scraping tools
 * @param prisma Prisma client for database access
 * @returns Object containing all processor instances
 */
export function createProcessors(
  buildRepository: IBuildRepository,
  analysisService: AnalysisService,
  executionEngine: ExecutionEngineService,
  prisma: PrismaClient
) {
  // Create processors with circular dependencies resolved
  // (Create them in reverse dependency order)
  
  // First create processors with no processor dependencies
  const executionProcessor = new ExecutionProcessor(
    buildRepository,
    executionEngine,
    prisma
  );
  
  // Then create the sample processor which doesn't need other processors
  const sampleProcessor = new SampleGenerationProcessor(
    buildRepository,
    executionEngine,
    prisma
  );
  
  // Create the refinement processor which needs the sample processor
  const refinementProcessor = new RefinementProcessor(
    buildRepository,
    analysisService,
    sampleProcessor,
    prisma
  );
  
  // Create the analysis processor which needs the sample processor
  const analysisProcessor = new BuildAnalysisProcessor(
    buildRepository,
    analysisService,
    sampleProcessor,
    prisma
  );
  
  // Return all processors
  return {
    analysisProcessor,
    sampleProcessor,
    refinementProcessor,
    executionProcessor
  };
}
