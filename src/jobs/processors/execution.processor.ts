/**
 * Execution Processor
 * 
 * Processes the full scrape execution phase of a build job
 */

import { PrismaClient, BuildStatus } from '../../generated/prisma/index.js';
import { IBuildRepository } from '../../infrastructure/db/build.repository.js';
import { ErrorCategory } from '../../core/domain/error-reporting.types.js';
import { BaseProcessor } from './base.processor.js';
import { ExecutionEngineService } from '../../infrastructure/execution/execution.service.js';

/**
 * Processor for executing full scrape jobs
 */
export class ExecutionProcessor extends BaseProcessor {
  /**
   * Initialize the Execution Processor
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
    super(buildRepository, prisma, ErrorCategory.EXECUTION);
  }

  /**
   * Process full execution for a build
   * 
   * @param buildId The build ID to execute
   * @returns True if successful, false if failed
   */
  async process(buildId: string): Promise<boolean> {
    this.log('Starting full scrape execution', buildId);

    try {
      // Update build status to show we're executing
      await this.buildRepository.updateBuildStatus(buildId, BuildStatus.SCRAPING_IN_PROGRESS);
      
      // Get the build
      const build = await this.buildRepository.findBuildById(buildId);
      
      if (!build) {
        throw new Error('Build not found for execution');
      }
      
      // Use the final package if available, otherwise fall back to initial
      const configPackage = build.finalPackageJson ? 
        JSON.parse(build.finalPackageJson as string) : 
        (build.initialPackageJson ? JSON.parse(build.initialPackageJson as string) : null);
      
      if (!configPackage) {
        throw new Error('Missing configuration package for execution');
      }
      
      // Get all target URLs
      const targetUrls = build.targetUrlsList || [];
      
      if (targetUrls.length === 0) {
        throw new Error('No target URLs available for execution');
      }
      
      // Execute the full scrape
      const executionResult = await this.executionEngine.executePackage(
        configPackage,
        targetUrls
      );
      
      // Store the execution results
      // Pass the execution result directly as it already matches the expected format
      await this.buildRepository.updateSampleResults(buildId, executionResult);
      
      // Update status to mark as completed
      await this.buildRepository.updateBuildStatus(buildId, BuildStatus.COMPLETED);
      
      this.log('Full scrape execution complete, build marked as completed', buildId);
      return true;
      
    } catch (error) {
      await this.handleError(error, buildId, {
        operation: 'executeScrape'
      }, BuildStatus.FAILED);
      
      return false;
    }
  }
}
