/**
 * Build Analysis Processor
 * 
 * Processes the analysis phase of a build job
 */

import { PrismaClient, BuildStatus } from '../../generated/prisma/index.js';
import { IBuildRepository } from '../../infrastructure/db/build.repository.js';
import { AnalysisService } from '../../modules/analysis/analysis.service.js';
import { ErrorCategory } from '../../core/domain/error-reporting.types.js';
import { BaseProcessor } from './base.processor.js';
import { AnalysisInput } from '../../modules/analysis/analysis.types.js';
import { SampleGenerationProcessor } from './sample-generation.processor.js';

/**
 * Processor for analyzing build requests and generating initial configuration
 */
export class BuildAnalysisProcessor extends BaseProcessor {
  /**
   * Initialize the Build Analysis Processor
   * 
   * @param buildRepository Repository for build data
   * @param analysisService Service for LLM-based analysis
   * @param sampleProcessor Sample generation processor for the next stage
   * @param prisma Prisma client for database access
   */
  constructor(
    protected buildRepository: IBuildRepository,
    private analysisService: AnalysisService,
    private sampleProcessor: SampleGenerationProcessor,
    protected prisma: PrismaClient
  ) {
    super(buildRepository, prisma, ErrorCategory.ANALYSIS);
  }

  /**
   * Process the analysis for a build
   * 
   * @param buildId The build ID to analyze
   * @param userObjective The user's objective
   * @param targetUrls Array of target URLs
   * @returns True if successful, false if failed
   */
  async process(
    buildId: string,
    userObjective: string,
    targetUrls: string[]
  ): Promise<boolean> {
    this.log('Starting analysis', buildId);

    try {
      // Update build status to show we're analyzing
      await this.buildRepository.updateBuildStatus(buildId, BuildStatus.PENDING_ANALYSIS);
      
      // Prepare analysis input
      const analysisInput: AnalysisInput = {
        buildId,
        userObjective,
        targetUrls
      };
      
      // Perform the analysis
      const analysisResult = await this.analysisService.analyzeBuildRequest(analysisInput);
      
      if (!analysisResult || !analysisResult.success || !analysisResult.package) {
        throw new Error('Analysis failed to produce a valid configuration package');
      }
      
      // Store the package
      await this.buildRepository.updateTempPackage(buildId, analysisResult.package);
      
      // Update status to proceed to sample generation
      await this.buildRepository.updateBuildStatus(buildId, BuildStatus.GENERATING_SAMPLES);
      
      this.log('Analysis successful, proceeding to sample generation', buildId);
      
      // Continue to sample generation
      return await this.sampleProcessor.process(buildId);
      
    } catch (error) {
      await this.handleError(error, buildId, {
        operation: 'analyzeUserObjective',
        userObjective
      }, BuildStatus.ANALYSIS_FAILED);
      
      return false;
    }
  }
}
