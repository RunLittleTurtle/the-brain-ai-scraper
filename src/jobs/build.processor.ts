import { PrismaClient, BuildStatus } from '../generated/prisma/index.js'; // Import Prisma types
import { UniversalConfigurationPackageFormatV1 } from '../core/domain/configuration-package.types.js';
import { ExecutionEngineService, ExecutionResult } from '../infrastructure/execution/execution.service.js';
import { BuildRepository, IBuildRepository } from '../infrastructure/db/build.repository.js'; // Import Repository
import { ToolboxService } from '../infrastructure/toolbox/toolbox.service.js'; // Import ToolboxService
import { FetchCheerioScraper } from '../infrastructure/toolbox/fetch-cheerio.scraper.js'; // Import Scraper
import { PlaywrightScraper } from '../infrastructure/toolbox/playwright.scraper.js'; // Import Scraper

// --- Instantiate Prisma Client and Repository ---
// TODO: Improve Prisma Client lifecycle management for background jobs
const prisma = new PrismaClient();
const buildRepository: IBuildRepository = new BuildRepository(prisma);

// --- Instantiate Toolbox and Execution Engine ---
const toolbox = new ToolboxService();
// Register available tools
toolbox.registerTool(new FetchCheerioScraper());
toolbox.registerTool(new PlaywrightScraper());

// Pass the toolbox to the engine
const executionEngine = new ExecutionEngineService(toolbox);

// --- Mock LLM Analysis (remains the same for now) --- 
function generateMockPackage(objective: string, urls: string[]): UniversalConfigurationPackageFormatV1 {
  console.log(`[BuildProcessor] Mock LLM generating package for objective: "${objective}"`);
  // Extremely basic example: always use fetch_cheerio_v1 to get the page title
  // A real implementation would involve complex LLM interaction
  return {
    schemaVersion: '1.0',
    description: `Mock package for: ${objective}`,
    scraper: {
      tool_id: 'scraper:fetch_cheerio_v1',
      parameters: {
        selectors: { title: 'head > title' }, // Example: Extract page title
        timeout_ms: 10000,
      },
    },
    // No auxiliary tools in this simple mock
  };
}

/**
 * Processes a build job.
 * This function would typically be called by a job queue worker (e.g., BullMQ).
 * @param jobId - The ID of the job being processed.
 * @param buildId - The ID of the build to process.
 */
export async function processBuildJob(jobId: string, buildId: string): Promise<void> {
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

  // Moved generatedPackage outside try for finally block access
  let generatedPackage: UniversalConfigurationPackageFormatV1 | null = null; 

  try {
    // --- 1. Mock LLM Analysis & Tool Selection --- 
    // Pass deserialized URLs to mock function
    generatedPackage = generateMockPackage(build.userObjective, build.targetUrlsList);
    // Store using repository
    await buildRepository.updateTempPackage(buildId, generatedPackage);

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
    // Use the instantiated executionEngine
    const executionResult = await executionEngine.executePackage(generatedPackage, sampleUrls);

    // --- 3. Store Results & Update Status --- 
    // Store using repository
    await buildRepository.updateSampleResults(buildId, executionResult);

    let finalStatus: BuildStatus;
    let finalError: string | undefined;

    if (executionResult.overallStatus === 'failed') {
      finalStatus = BuildStatus.FAILED;
      finalError = executionResult.error || 'Sample generation failed';
    } else {
      // Includes 'completed' and 'partial_success'
      finalStatus = BuildStatus.PENDING_USER_FEEDBACK;
    }
    // Update status using repository
    await buildRepository.updateBuildStatus(buildId, finalStatus, finalError);

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
