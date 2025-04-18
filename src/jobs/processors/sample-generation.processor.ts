/**
 * Sample Generation Processor
 * 
 * Processes the sample generation phase of a build job
 */

import { PrismaClient, BuildStatus } from '../../generated/prisma/index.js';
import { IBuildRepository } from '../../infrastructure/db/build.repository.js';
import { ErrorCategory } from '../../core/domain/error-reporting.types.js';
import { BaseProcessor } from './base.processor.js';
import { ExecutionEngineService } from '../../infrastructure/execution/execution.service.js';

/**
 * Processor for generating sample results based on initial configuration
 */
export class SampleGenerationProcessor extends BaseProcessor {
  /**
   * Initialize the Sample Generation Processor
   * 
   * @param buildRepository Repository for build data
   * @param executionEngine Service for executing scraping tools
   * @param prisma Prisma client for database access
   */
  constructor(
    protected buildRepository: IBuildRepository,
    private executionEngine: ExecutionEngineService,
    protected prisma: PrismaClient
  ) {
    super(buildRepository, prisma, ErrorCategory.SAMPLE_GENERATION);
  }

  /**
   * Process sample generation for a build
   * 
   * @param buildId The build ID to generate samples for
   * @returns True if successful, false if failed
   */
  async process(buildId: string): Promise<boolean> {
    this.log('Starting sample generation', buildId);

    try {
      // Update build status to show we're generating samples
      await this.buildRepository.updateBuildStatus(buildId, BuildStatus.GENERATING_SAMPLES);
      
      // Get the build
      const build = await this.buildRepository.findBuildById(buildId);
      
      if (!build || !build.initialPackageJson) {
        throw new Error('Build not found or missing configuration package');
      }
      
      // Parse the package
      const configPackage = JSON.parse(build.initialPackageJson as string);
      
      // Get the first few target URLs for sampling
      const targetUrls = build.targetUrlsList || [];
      const sampleUrls = targetUrls.slice(0, Math.min(3, targetUrls.length));
      
      if (sampleUrls.length === 0) {
        throw new Error('No target URLs available for sampling');
      }
      
      // Execute the sample
      const executionResult = await this.executionEngine.executePackage(
        configPackage,
        sampleUrls
      );
      
      // Store the sample results
      // Pass the execution result directly as it already matches the expected format
      await this.buildRepository.updateSampleResults(buildId, executionResult);
      
      // Update status to indicate waiting for user feedback
      await this.buildRepository.updateBuildStatus(buildId, BuildStatus.PENDING_USER_FEEDBACK);
      
      this.log('Sample generation complete, waiting for user feedback', buildId);
      return true;
      
    } catch (error) {
      await this.handleError(error, buildId, {
        operation: 'generateSamples'
      }, BuildStatus.FAILED);
      
      return false;
    }
  }
}
