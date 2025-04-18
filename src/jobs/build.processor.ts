/**
 * @deprecated This monolithic build processor is being replaced with the modular processors in /jobs/processors
 * See /jobs/processors/index.ts for the new implementation
 */

import { PrismaClient, BuildStatus } from '../generated/prisma/index.js'; // Import Prisma types
import { UniversalConfigurationPackageFormatV1 } from '../core/domain/configuration-package.types.js';
import { ExecutionEngineService, ExecutionResult } from '../infrastructure/execution/execution.service.js';
import { BuildRepository, IBuildRepository } from '../infrastructure/db/build.repository.js'; // Import Repository
import { ToolboxService } from '../infrastructure/toolbox/toolbox.service.js'; // Import ToolboxService
import { FetchCheerioScraper } from '../infrastructure/toolbox/fetch-cheerio.scraper.js'; // Import Scraper
import { PlaywrightScraper } from '../infrastructure/toolbox/playwright.scraper.js'; // Import Scraper
// Import Analysis Service and Types
import { AnalysisService } from '../modules/analysis/analysis.service.js';
import { AnalysisInput, AnalysisResult, RefinementInput, RefinementResult } from '../modules/analysis/analysis.types.js';
// Import Error Reporting
import { errorReportingService } from '../core/services/error-reporting.service.js';
import { ErrorCategory, ErrorSeverity } from '../core/domain/error-reporting.types.js';

// Import new modular processors
import { 
  createProcessors, 
  BuildAnalysisProcessor,
  SampleGenerationProcessor,
  RefinementProcessor,
  ExecutionProcessor,
  FeedbackType
} from './processors/index.js'; 

/**
 * Processes a build job.
 * Dependencies are injected.
 * @param jobId - The ID of the job being processed.
 * @param buildId - The ID of the build to process.
 * @param buildRepository - Instance of BuildRepository.
 * @param analysisService - Instance of AnalysisService.
 * @param executionEngine - Instance of ExecutionEngineService.
 */
/**
 * @deprecated This class is being replaced with modular processors in /jobs/processors
 * BuildProcessor class that delegates to the new modular processors
 */
export class BuildProcessor {
  private analysisProcessor: BuildAnalysisProcessor;
  private sampleProcessor: SampleGenerationProcessor;
  private refinementProcessor: RefinementProcessor;
  private executionProcessor: ExecutionProcessor;

  /**
   * Initialize the BuildProcessor with all required dependencies
   * This implementation now delegates to the new modular processors
   * 
   * @param buildRepository Repository for build data access
   * @param analysisService Service for LLM-based analysis
   * @param executionEngine Service for executing scraping tools
   * @param prisma Prisma client for direct database access if needed
   */
  constructor(
    private buildRepository: IBuildRepository,
    private analysisService: AnalysisService,
    private executionEngine: ExecutionEngineService,
    private prisma: PrismaClient
  ) {
    // Create processor instances using the factory function
    const processors = createProcessors(
      buildRepository,
      analysisService,
      executionEngine,
      prisma
    );
    
    // Store references to all processors
    this.analysisProcessor = processors.analysisProcessor;
    this.sampleProcessor = processors.sampleProcessor;
    this.refinementProcessor = processors.refinementProcessor;
    this.executionProcessor = processors.executionProcessor;
  }

  /**
   * @deprecated Use the BuildAnalysisProcessor directly
   * Process an analysis job for a new build
   * 
   * @param buildId The ID of the build to analyze
   * @param userObjective The user's objective for the scrape
   * @param targetUrls The target URLs to scrape
   */
  async processAnalysisJob(
    buildId: string,
    userObjective: string,
    targetUrls: string[]
  ): Promise<void> {
    console.log(`[BuildProcessor:Deprecated] Delegating to AnalysisProcessor for build ${buildId}`);
    
    // Delegate to the new modular processor
    await this.analysisProcessor.process(buildId, userObjective, targetUrls);
  }

  /**
   * @deprecated Use the SampleGenerationProcessor directly
   * Process a sample generation job for a build
   * 
   * @param buildId The ID of the build to generate samples for
   */
  async processSampleGenerationJob(buildId: string): Promise<void> {
    console.log(`[BuildProcessor:Deprecated] Delegating to SampleGenerationProcessor for build ${buildId}`);
    
    // Delegate to the new modular processor
    await this.sampleProcessor.process(buildId);
  }

  /**
   * @deprecated Use the RefinementProcessor directly
   * Process a refinement job based on user feedback
   * 
   * @param buildId The ID of the build to refine
   * @param userFeedback The user's feedback for refinement
   * @param feedbackType Optional type of feedback (defaults to sample feedback)
   */
  async processRefinementJob(
    buildId: string,
    userFeedback: any,
    feedbackType: string = 'sample_feedback'
  ): Promise<void> {
    console.log(`[BuildProcessor:Deprecated] Delegating to RefinementProcessor for build ${buildId}`);
    
    // Determine feedback type
    const fbType = feedbackType === 'proposal_feedback' ? 
      FeedbackType.PROPOSAL_FEEDBACK : 
      FeedbackType.SAMPLE_FEEDBACK;
      
    // Delegate to the new modular processor
    await this.refinementProcessor.process(buildId, userFeedback, fbType);

  // Avoid reprocessing builds not in the refinement state
  if (build.status !== BuildStatus.PROCESSING_FEEDBACK) {
    console.warn(`[BuildProcessor] Build ${buildId} is not in PROCESSING_FEEDBACK state (current: ${build.status}). Skipping refinement job ${jobId}.`);
    return;
  }

  // Check if we have all the required data
  if (!build.initialPackageJson || !build.sampleResultsJson || !build.userFeedbackJson) {
    const failMsg = 'Missing required data for refinement (package, results, or feedback)';
    console.warn(`[BuildProcessor] ${failMsg} for build ${buildId}.`);
    await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, failMsg);
    return;
  }

  // Parse the feedback, original package, and sample results
  let userFeedback: string;
  let toolHints: string[] = [];
  let initialPackage: UniversalConfigurationPackageFormatV1;
  let sampleResults: any[];

  try {
    // Parse the user feedback
    const userFeedbackData = typeof build.userFeedbackJson === 'string' 
      ? JSON.parse(build.userFeedbackJson) 
      : build.userFeedbackJson;

    userFeedback = userFeedbackData.feedback;
    toolHints = userFeedbackData.tool_hints || [];

    // Parse the initial package
    const packageToRefine = build.finalPackageJson ? 
      JSON.parse(build.finalPackageJson as string) : 
      (build.initialPackageJson ? JSON.parse(build.initialPackageJson as string) : null);

    if (!packageToRefine) {
      throw new Error('Missing configuration package for refinement');
    }

    initialPackage = packageToRefine;

    // Parse the sample results
    sampleResults = typeof build.sampleResultsJson === 'string' 
      ? JSON.parse(build.sampleResultsJson) 
      : build.sampleResultsJson;
  } catch (parseError: any) {
    console.error(`[BuildProcessor] Error parsing data for refinement job ${jobId}:`, parseError);
    await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, `Data parsing error: ${parseError.message}`);
    return;
  }

  // Moved refinedPackage outside try for finally block access
  let refinedPackage: UniversalConfigurationPackageFormatV1 | null = null;

  try {
    // --- 1. LLM Refinement & Tool Selection/Switching ---
    console.log(`[BuildProcessor] Starting refinement phase for build ${buildId}`);
    
    const refinementInput: RefinementInput = {
      buildId: build.id,
      configPackage: initialPackage,
      userFeedback
    };

    const refinementResult: RefinementResult = await analysisService.refineBuildConfiguration(refinementInput);

    if (!refinementResult.success || !refinementResult.package) {
      console.error(`[BuildProcessor] Refinement failed for build ${buildId}: ${refinementResult.error}`);
      await buildRepository.updateBuildStatus(
        buildId,
        BuildStatus.FAILED,
        `Refinement failed: ${refinementResult.error} (Reason: ${refinementResult.failureReason || 'unknown'})`
      );
      return;
    }

    // Refinement successful, store the refined package
    refinedPackage = refinementResult.package;
    if (refinedPackage) {
      await buildRepository.updateTempPackage(buildId, refinedPackage);
      console.log(`[BuildProcessor] Refinement successful, refined package stored for build ${buildId}`);
    } else {
      console.error(`[BuildProcessor] Internal error: refinedPackage is null after successful refinement for build ${buildId}`);
      await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, 'Internal error during refinement result handling');
      return;
    }

    // --- 2. Generate New Samples with Refined Package ---
    await buildRepository.updateBuildStatus(buildId, BuildStatus.GENERATING_SAMPLES);

    const sampleUrls = build.targetUrlsList && build.targetUrlsList.length > 0 
      ? build.targetUrlsList.slice(0, 3) 
      : [];
      
    if (sampleUrls.length === 0) {
      console.warn(`[BuildProcessor] Build ${buildId} has no target URLs for sample generation after refinement.`);
      await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, 'No target URLs for sample generation');
      return;
    }

    console.log(`[BuildProcessor] Generating new samples with refined package for ${sampleUrls.length} URLs for build ${buildId}`);
    
    if (!refinedPackage) {
      console.error(`[BuildProcessor] Internal error: refinedPackage is null before sample generation for build ${buildId}`);
      await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, 'Internal error: Missing package for sample generation');
      return;
    }

    let executionResult: ExecutionResult | undefined;
    try {
      executionResult = await executionEngine.executePackage(refinedPackage, sampleUrls);
    } catch (toolError: any) {
      await buildRepository.updateBuildStatus(
        buildId,
        BuildStatus.FAILED,
        toolError?.message || 'Tool execution error during refined sample generation'
      );
      return;
    }

    // --- 3. Store Results & Update Status ---
    if (executionResult?.overallStatus === 'failed') {
      await buildRepository.updateBuildStatus(
        buildId,
        BuildStatus.FAILED,
        executionResult.error || 'Refined sample generation failed'
      );
      return;
    }

    // Store refined sample results
    if (executionResult) {
      await buildRepository.updateSampleResults(buildId, executionResult);
      if (executionResult.overallStatus === 'partial_success') {
        await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, executionResult.error || 'Partial execution of refined samples');
      } else {
        await buildRepository.updateBuildStatus(buildId, BuildStatus.PENDING_USER_FEEDBACK);
      }
    }

    // Fetch final status for logging
    const finalBuildState = await buildRepository.findBuildById(buildId);
    console.log(`[BuildProcessor] Completed refinement job ${jobId} for build ${buildId}. Final status: ${finalBuildState?.status}`);

  } catch (error: any) {
    console.error(`[BuildProcessor] Error processing refinement job ${jobId} for build ${buildId}:`, error);
    await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, error.message || 'Unknown refinement processing error');
  } finally {
    // --- 4. Cleanup Tools ---
    console.log(`[BuildProcessor] Cleaning up tools for refinement job ${jobId}, build ${buildId}`);
    await executionEngine.cleanupTools();
  }
}

/**
 * @deprecated Use the new modular processors directly
 * Process a full build job (legacy method)
 * 
 * @param jobId The job ID
 * @param buildId The build ID to process
 */
async processBuildJob(
  jobId: string, 
  buildId: string
): Promise<void> {
  console.log(`[BuildProcessor:Deprecated] Starting legacy job ${jobId} for build ${buildId}`);
  console.log(`[BuildProcessor:Deprecated] This method is deprecated. Please use the new modular processors directly.`);
  
  // Use repository to get build data
  const build = await this.buildRepository.findBuildById(buildId);
  
  if (!build || !build.targetUrlsList) { // Check for build and parsed URLs
    const errorMessage = `Build ${buildId} not found or targetUrls parsing failed for job ${jobId}`;
    console.error(`[BuildProcessor:Deprecated] ${errorMessage}`);
    return;
  }  if (build) {
    // Capture detailed error information
    const errorDetails = errorReportingService.createErrorDetails(
      new Error(errorMessage),
      ErrorCategory.VALIDATION,
      undefined,
      {
        buildId,
        jobId,
        operation: 'processBuildJob',
        parsedUrls: build.targetUrlsList ? 'success' : 'failed'
      }
    );
    
    // Update build with detailed error
    await buildRepository.updateBuildError(buildId, errorDetails);
  }
  
  return; 
    // Use the real Analysis Service
    // Status remains PENDING_ANALYSIS during this phase
    console.log(`[BuildProcessor] Starting analysis phase for build ${buildId}`);
    const analysisInput: AnalysisInput = {
      buildId: build.id,
      userObjective: build.userObjective,
      targetUrls: build.targetUrlsList, // Use deserialized URLs
    };
    const analysisResult: AnalysisResult = await analysisService.analyzeBuildRequest(analysisInput);

    if (!analysisResult.success || !analysisResult.package) {
      console.error(`[BuildProcessor] Analysis failed for build ${buildId}: ${analysisResult.error}`);
      // Update status using repository with failure reason
      await buildRepository.updateBuildStatus(
        buildId, 
        BuildStatus.FAILED, 
        `Analysis failed: ${analysisResult.error} (Reason: ${analysisResult.failureReason || 'unknown'})`
      );
      return; // Stop processing if analysis fails
    }

    // Analysis successful, store the temporary package
    generatedPackage = analysisResult.package;
    // Add null check for type safety, although logic ensures it's not null here
    if (generatedPackage) {
      await buildRepository.updateTempPackage(buildId, generatedPackage);
      console.log(`[BuildProcessor] Analysis successful, temp package stored for build ${buildId}`);
    } else {
       // This case should technically not be reached due to the checks above
       console.error(`[BuildProcessor] Internal error: generatedPackage is null after successful analysis for build ${buildId}`);
       await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, 'Internal error during analysis result handling');
       return;
    }

    // --- 2. Initial Sample Generation --- 
    // Update status using repository
    await buildRepository.updateBuildStatus(buildId, BuildStatus.GENERATING_SAMPLES);

    const sampleUrls = build.targetUrlsList.slice(0, 3); // Use deserialized URLs
    if (sampleUrls.length === 0) {
        console.warn(`[BuildProcessor] Build ${buildId} has no target URLs for sampling.`);
        // Update status using repository
        await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, 'No target URLs provided');
        return;
    }

    console.log(`[BuildProcessor] Generating samples for ${sampleUrls.length} URLs for build ${buildId}`);
    // Use the instantiated executionEngine and the package from analysis
    // Add null check for type safety
    if (!generatedPackage) {
      // Should not happen if analysis succeeded and package was stored
      console.error(`[BuildProcessor] Internal error: generatedPackage is null before sample generation for build ${buildId}`);
      await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, 'Internal error: Missing package for sample generation');
      return;
    }
    let executionResult: ExecutionResult | undefined;
    try {
      executionResult = await executionEngine.executePackage(generatedPackage, sampleUrls);
    } catch (toolError: any) {
      console.error(`[BuildProcessor] Tool execution error for build ${buildId}:`, toolError);
      
      // Capture detailed error information
      const errorDetails = errorReportingService.createScrapingErrorDetails(
        toolError,
        {
          buildId,
          jobId,
          operation: 'processBuildJob.toolExecution',
          packageType: generatedPackage?.schemaVersion,
          targetUrls: sampleUrls.slice(0, 3) // Include just a few URLs for context
        }
      );
      
      // Update build with detailed error
      await buildRepository.updateBuildError(buildId, errorDetails);
      // Optionally, store partial executionResult if available
      return;
    }

    // --- 3. Store Results & Update Status --- 
    if (executionResult?.overallStatus === 'failed') {
      // If execution failed, capture detailed error information
      const errorDetails = errorReportingService.createScrapingErrorDetails(
        new Error(executionResult.error || 'Sample generation failed'),
        {
          buildId,
          jobId,
          operation: 'processBuildJob.sampleGeneration',
          packageType: generatedPackage?.schemaVersion,
          targetUrls: sampleUrls,
          results: executionResult.results,
          failureReason: executionResult.error
        }
      );
      
      // Update build with detailed error
      await buildRepository.updateBuildError(buildId, errorDetails);
      return;
    }
    // Store sample results for completed or partial
    if (executionResult) {
      await buildRepository.updateSampleResults(buildId, executionResult);
      // If partial_success, set status to FAILED but still store results
      // Lint fix: partial_success is the valid status, not 'partial'
      if (executionResult.overallStatus === 'partial_success') {
        // For partial success, store a warning-level error with details about which URLs failed
        const partialErrorDetails = errorReportingService.createErrorDetails(
          executionResult.error || 'Partial execution success',
          ErrorCategory.SCRAPING,
          undefined,
          {
            buildId,
            jobId,
            operation: 'processBuildJob.partialSuccess',
            successCount: executionResult.results.filter(r => r.status === 'success').length,
            failureCount: executionResult.results.filter(r => r.status === 'failed').length,
            failedUrls: executionResult.results
              .filter(r => r.status === 'failed')
              .map(r => ({ url: r.url, error: r.error }))
          }
        );
        
        // Update build with detailed error but still allow user feedback
        await buildRepository.updateBuildError(buildId, partialErrorDetails);
        await buildRepository.updateBuildStatus(buildId, BuildStatus.PENDING_USER_FEEDBACK);
      } else {
        await buildRepository.updateBuildStatus(buildId, BuildStatus.PENDING_USER_FEEDBACK);
      }
    }

    // Fetch final status for logging (optional)
    const finalBuildState = await buildRepository.findBuildById(buildId);
    console.log(`[BuildProcessor] Completed job ${jobId} for build ${buildId}. Final status: ${finalBuildState?.status}`);

  } catch (error: any) {
    console.error(`[BuildProcessor] Error processing job ${jobId} for build ${buildId}:`, error);
    
    // Determine the error category based on error properties or message
    let errorCategory = ErrorCategory.UNKNOWN;
    if (error.name === 'AnalysisError' || error.message?.includes('analysis')) {
      errorCategory = ErrorCategory.ANALYSIS;
    } else if (error.name === 'ScrapingError' || error.message?.includes('scraping') || error.message?.includes('execution')) {
      errorCategory = ErrorCategory.SCRAPING;
    } else if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      errorCategory = ErrorCategory.VALIDATION;
    }
    
    // Capture detailed error information
    const errorDetails = errorReportingService.createErrorDetails(
      error,
      errorCategory,
      undefined,
      {
        buildId,
        jobId,
        operation: 'processBuildJob',
        userObjective: build?.userObjective,
        targetUrlsCount: build?.targetUrlsList?.length
      }
    );
    
    // Update build with detailed error
    await buildRepository.updateBuildError(buildId, errorDetails);
  } finally {
    // --- 4. Cleanup Tools --- 
    // Ensure cleanup happens even if executePackage throws
    console.log(`[BuildProcessor] Cleaning up tools for job ${jobId}, build ${buildId}`);
    await executionEngine.cleanupTools();
  }
}
