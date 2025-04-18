/**
 * Refinement Processor
 * 
 * Processes the refinement phase of a build job based on user feedback
 */

import { PrismaClient, BuildStatus } from '../../generated/prisma/index.js';
import { IBuildRepository } from '../../infrastructure/db/build.repository.js';
import { ErrorCategory } from '../../core/domain/error-reporting.types.js';
import { BaseProcessor } from './base.processor.js';
import { AnalysisService } from '../../modules/analysis/analysis.service.js';
import { RefinementInput } from '../../modules/analysis/analysis.types.js';
import { SampleGenerationProcessor } from './sample-generation.processor.js';

/**
 * Feedback types for refinement
 */
export enum FeedbackType {
  PROPOSAL_FEEDBACK = 'proposal_feedback',
  SAMPLE_FEEDBACK = 'sample_feedback'
}

/**
 * Processor for refining configurations based on user feedback
 */
export class RefinementProcessor extends BaseProcessor {
  /**
   * Initialize the Refinement Processor
   * 
   * @param buildRepository Repository for build data
   * @param analysisService Service for LLM-based analysis
   * @param sampleProcessor Sample generation processor for re-sampling if needed
   * @param prisma Prisma client for database access
   */
  constructor(
    protected buildRepository: IBuildRepository,
    private analysisService: AnalysisService,
    private sampleProcessor: SampleGenerationProcessor,
    protected prisma: PrismaClient
  ) {
    super(buildRepository, prisma, ErrorCategory.REFINEMENT);
  }

  /**
   * Process refinement for a build based on user feedback
   * 
   * @param buildId The build ID to refine
   * @param userFeedback User feedback for refinement
   * @param feedbackType Type of feedback (proposal or sample)
   * @returns True if successful, false if failed
   */
  async process(
    buildId: string,
    userFeedback: any,
    feedbackType: FeedbackType
  ): Promise<boolean> {
    this.log('Starting refinement based on user feedback', buildId);

    try {
      // Update status to show we're working on refinement
      await this.buildRepository.updateBuildStatus(buildId, BuildStatus.PROCESSING_FEEDBACK);
      
      // Get the build
      const build = await this.buildRepository.findBuildById(buildId);
      
      if (!build) {
        throw new Error('Build not found for refinement');
      }
      
      // Get the latest configuration package to refine
      const packageToRefine = build.finalPackageJson ? 
        JSON.parse(build.finalPackageJson as string) : 
        (build.initialPackageJson ? JSON.parse(build.initialPackageJson as string) : null);
      
      if (!packageToRefine) {
        throw new Error('Missing configuration package for refinement');
      }
      
      // Store the user feedback
      await this.buildRepository.updateUserFeedback(buildId, JSON.stringify(userFeedback));
      
      // Get sample results if available
      let sampleResults: any[] = [];
      if (build.sampleResultsJson) {
        try {
          const parsedResults = JSON.parse(build.sampleResultsJson as string);
          sampleResults = parsedResults.results || [];
        } catch (parseError) {
          this.log('Warning: Could not parse sample results JSON', buildId);
          // Continue with empty results rather than failing
        }
      }
      
      // Prepare the refinement input with all required fields
      const refinementInput: RefinementInput = {
        buildId,
        originalObjective: build.userObjective || '',
        previousPackage: packageToRefine,
        sampleResults,
        userFeedback: typeof userFeedback === 'string' ? userFeedback : JSON.stringify(userFeedback)
      };
      
      // Use the analysis service to refine the configuration
      this.log('Refining configuration based on feedback', buildId);
      const refinementResult = await this.analysisService.refineBuildConfiguration(refinementInput);
      
      if (!refinementResult || !refinementResult.package) {
        throw new Error('Refinement failed to produce a valid configuration package');
      }
      
      // Store the refined configuration
      await this.buildRepository.updateBuildStatus(buildId, BuildStatus.GENERATING_SAMPLES);
      
      // Update the temporary package with the refined configuration
      if (refinementResult.package) {
        await this.buildRepository.updateTempPackage(buildId, refinementResult.package);
      }
      
      // Handle next steps based on feedback type
      if (feedbackType === FeedbackType.PROPOSAL_FEEDBACK) {
        // If this was proposal feedback, generate new samples
        this.log('Proposal feedback processed, proceeding to generate new samples', buildId);
        return await this.sampleProcessor.process(buildId);
      } else if (feedbackType === FeedbackType.SAMPLE_FEEDBACK) {
        // User has accepted the samples, update the build as ready for execution
        await this.buildRepository.updateBuildStatus(buildId, BuildStatus.READY_FOR_SCRAPING);
        
        // Update the final configuration
        if (refinementResult.package) {
          await this.buildRepository.updateFinalConfiguration(buildId, refinementResult.package);
        }
        
        this.log(`Sample feedback accepted, build is ready for execution`, buildId);
        return true;
      }
      
      // If we reached here with an unexpected feedback type, return false
      return false;
      
    } catch (error) {
      await this.handleError(error, buildId, {
        operation: 'refineBuildConfiguration',
        feedbackType
      }, BuildStatus.FAILED);
      
      return false;
    }
  }
}
