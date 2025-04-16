import { PrismaClient, BuildStatus } from '../generated/prisma/index.js'; // Import Prisma types
import { UniversalConfigurationPackageFormatV1 } from '../core/domain/configuration-package.types.js';
import { ExecutionEngineService, ExecutionResult } from '../infrastructure/execution/execution.service.js';
import { BuildRepository, IBuildRepository } from '../infrastructure/db/build.repository.js'; // Import Repository
import { ToolboxService } from '../infrastructure/toolbox/toolbox.service.js'; // Import ToolboxService
import { FetchCheerioScraper } from '../infrastructure/toolbox/fetch-cheerio.scraper.js'; // Import Scraper
import { PlaywrightScraper } from '../infrastructure/toolbox/playwright.scraper.js'; // Import Scraper
// Import Analysis Service and Types
import { AnalysisService } from '../modules/analysis/analysis.service.js';
import { AnalysisInput, AnalysisResult } from '../modules/analysis/analysis.types.js';

// --- Instantiate Prisma Client --- 
// TODO: Improve Prisma Client lifecycle management & Inject this too!
const prisma = new PrismaClient(); 

/**
 * Processes a build job.
 * Dependencies are injected.
 * @param jobId - The ID of the job being processed.
 * @param buildId - The ID of the build to process.
 * @param buildRepository - Instance of BuildRepository.
 * @param analysisService - Instance of AnalysisService.
 * @param executionEngine - Instance of ExecutionEngineService.
 */
export async function processBuildJob(
  jobId: string, 
  buildId: string,
  // Injected Dependencies:
  buildRepository: IBuildRepository,
  analysisService: AnalysisService,
  executionEngine: ExecutionEngineService
): Promise<void> {
  console.log(`[BuildProcessor] Starting job ${jobId} for build ${buildId}`);

  // Use repository to get build data
  const build = await buildRepository.findBuildById(buildId);

  if (!build || !build.targetUrlsList) { // Check for build and parsed URLs
    console.error(`[BuildProcessor] Build ${buildId} not found or targetUrls parsing failed for job ${jobId}.`);
    // Handle error appropriately
    return;
  }

  // Avoid reprocessing builds not in the initial state
  if (build.status !== BuildStatus.PENDING_ANALYSIS) {
    console.warn(`[BuildProcessor] Build ${buildId} is not in PENDING_ANALYSIS state (current: ${build.status}). Skipping job ${jobId}.`);
    return; 
  }

  // --- Add check for empty targetUrlsList --- 
  if (!build.targetUrlsList || build.targetUrlsList.length === 0) {
    const failMsg = 'No target URLs provided';
    console.warn(`[BuildProcessor] Build ${buildId} has no target URLs for sampling.`);
    await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, failMsg);
    return;
  }
  // --- End check ---

  // Moved generatedPackage outside try for finally block access
  let generatedPackage: UniversalConfigurationPackageFormatV1 | null = null; 

  try {
    // --- 1. LLM Analysis & Tool Selection --- 
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
    const executionResult = await executionEngine.executePackage(generatedPackage, sampleUrls);

    // --- 3. Store Results & Update Status --- 
    if (executionResult.overallStatus === 'failed') {
      // If execution failed, update status to FAILED and skip storing sample results
      await buildRepository.updateBuildStatus(
        buildId,
        BuildStatus.FAILED,
        executionResult.error || 'Sample generation failed'
      );
      return;
    }
    // Only store sample results if execution succeeded (includes 'completed' and 'partial_success')
    await buildRepository.updateSampleResults(buildId, executionResult);
    await buildRepository.updateBuildStatus(buildId, BuildStatus.PENDING_USER_FEEDBACK);

    // Fetch final status for logging (optional)
    const finalBuildState = await buildRepository.findBuildById(buildId);
    console.log(`[BuildProcessor] Completed job ${jobId} for build ${buildId}. Final status: ${finalBuildState?.status}`);

  } catch (error: any) {
    console.error(`[BuildProcessor] Error processing job ${jobId} for build ${buildId}:`, error);
    // Update status using repository
    await buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, error.message || 'Unknown processing error');
  } finally {
    // --- 4. Cleanup Tools --- 
    // Ensure cleanup happens even if executePackage throws
    console.log(`[BuildProcessor] Cleaning up tools for job ${jobId}, build ${buildId}`);
    await executionEngine.cleanupTools();
  }
}
