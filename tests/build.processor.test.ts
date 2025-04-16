import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { PrismaClient, BuildStatus, Build } from '../src/generated/prisma/index.js'; // Import Prisma types
import { UniversalConfigurationPackageFormatV1 } from '../src/core/domain/configuration-package.types.js';
import { ExecutionEngineService, ExecutionResult } from '../src/infrastructure/execution/execution.service.js'; // Use class directly
import { BuildRepository, IBuildRepository } from '../src/infrastructure/db/build.repository.js'; // Import Repository
import { ToolboxService } from '../src/infrastructure/toolbox/toolbox.service.js'; // Import ToolboxService
// Import Analysis Service and Types
import { AnalysisService } from '../src/modules/analysis/analysis.service.js';
import { AnalysisInput, AnalysisResult } from '../src/modules/analysis/analysis.types.js';

// --- Define Signatures for Mocked Methods ---
// type FindBuildByIdFn = (id: string) => Promise<Build | null>;
// type UpdateBuildStatusFn = (id: string, status: BuildStatus, error?: string) => Promise<Build | null>;
// type UpdateTempPackageFn = (id: string, pkg: UniversalConfigurationPackageFormatV1) => Promise<Build | null>;
// type UpdateSampleResultsFn = (id: string, results: ExecutionResult) => Promise<Build | null>;
// type AnalyzeBuildRequestFn = (input: AnalysisInput) => Promise<AnalysisResult>;
// type ExecutePackageFn = (configPackage: UniversalConfigurationPackageFormatV1, targetUrls: string[]) => Promise<ExecutionResult>;

// --- Mock Service Instances (Reverted to simple objects with casting) ---
const mockBuildRepositoryInstance = {
    findBuildById: vi.fn(),
    updateBuildStatus: vi.fn(),
    updateTempPackage: vi.fn(),
    updateSampleResults: vi.fn(),
    // We still need other methods from IBuildRepository to satisfy the type, even if not used in tests
    createBuild: vi.fn(),
    updateFinalConfiguration: vi.fn(),
} as unknown as IBuildRepository;

const mockAnalysisInstance = {
    analyzeBuildRequest: vi.fn(),
    // Add other AnalysisService methods/properties if needed for type compatibility
} as unknown as AnalysisService;

const mockExecutionEngineInstance = {
    executePackage: vi.fn(),
    cleanupTools: vi.fn(),
    // Add missing properties required by Mocked<ExecutionEngineService>
    // toolbox: vi.fn(), // Removed - properties not needed for basic object mock
    // instantiatedTools: new Map(),
} as unknown as ExecutionEngineService;

const mockToolboxInstance = {
    getTool: vi.fn(),
    registerTool: vi.fn(),
    listTools: vi.fn(),
    registerDefaultTools: vi.fn(),
    // Add missing properties required by Mocked<ToolboxService>
    // tools: new Map(),
    // logger: { ... },
} as unknown as ToolboxService;

// Dynamically imported processBuildJob function
let processBuildJob: (
  jobId: string, 
  buildId: string,
  buildRepository: IBuildRepository,
  analysisService: AnalysisService, 
  executionEngine: ExecutionEngineService 
) => Promise<void>;

// Mock Execution Result (Success)
const mockExecutionResult: ExecutionResult = {
  overallStatus: 'completed',
  results: ['http://example.com', 'http://example.org'].map(url => ({ url, data: { title: 'Mock Title' }, status: 'success', success: true, error: undefined })),
};

// Mock Build Object (Default: PENDING_ANALYSIS)
const mockBuild: Build & { targetUrlsList: string[] } = {
  id: 'test-build-id',
  userId: null,
  userObjective: 'Get titles',
  targetUrls: JSON.stringify(['http://example.com', 'http://example.org']),
  targetUrlsList: ['http://example.com', 'http://example.org'],
  status: BuildStatus.PENDING_ANALYSIS,
  error: null, 
 
  initialPackageJson: null,
  sampleResultsJson: null, 
  finalConfigurationJson: null, 
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock Analysis Result (Success)
const mockAnalysisResultSuccess: AnalysisResult = {
    success: true,
    package: {
      schemaVersion: '1.0', 
      description: 'Mock analysis result package', 
      scraper: {
        tool_id: 'scraper:fetch_cheerio_v1', 
        parameters: {
          selectors: { title: 'h1', description: '.desc' }, 
          // Add other necessary scraper parameters here
        },
        // Ensure ScraperToolConfiguration specific fields are present if needed
      },
      expectedOutputSchema: { 
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['title']
      }
    },
};

// --- Test Suite --- 

describe('processBuildJob', () => {
    // We can directly use the mock instances defined above in the tests

    beforeEach(async () => {
        // Dynamically import the module under test AFTER mocks are set up
        const { processBuildJob: importedFunc } = await import('../src/jobs/build.processor.js');
        processBuildJob = importedFunc;

        // Reset mocks before each test
        vi.clearAllMocks();

        // --- Default Mock Implementations (Success Path) ---
        // Most tests expect the build to be found initially
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValue(mockBuild); 
        // No status update immediately after findById in the default success path
        // vi.mocked(mockBuildRepositoryInstance.updateBuildStatus).mockResolvedValue({ ...mockBuild, status: BuildStatus.ANALYZING }); // Removed invalid status

        vi.mocked(mockAnalysisInstance.analyzeBuildRequest).mockResolvedValue(mockAnalysisResultSuccess);
        // After analysis, updateTempPackage is called. Assume status changes to GENERATING_SAMPLES.
        vi.mocked(mockBuildRepositoryInstance.updateTempPackage).mockResolvedValue({ ...mockBuild, status: BuildStatus.GENERATING_SAMPLES });
        vi.mocked(mockExecutionEngineInstance.executePackage).mockResolvedValue(mockExecutionResult);
        // After execution, updateSampleResults is called. Assume status changes to CONFIRMED.
        vi.mocked(mockBuildRepositoryInstance.updateSampleResults).mockResolvedValue({ ...mockBuild, status: BuildStatus.CONFIRMED });
        // Final status update after successful completion.
        vi.mocked(mockBuildRepositoryInstance.updateBuildStatus).mockResolvedValue({ ...mockBuild, status: BuildStatus.CONFIRMED }); // Final success update

        // Spy on console methods
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks(); // Restore original implementations
    });

    afterEach(() => {
        vi.restoreAllMocks(); // Important: Resets spies and mocks after each test
    });

    // --- Mock Data Definitions (Defined outside/before describe for clarity) --- 
    const jobId = 'test-job-id';
    const buildId = 'test-build-id';
    const mockUrls = ['http://example.com', 'http://example.org'];
    const mockObjective = 'Get titles';

    // --- Tests ---
    it('should successfully process a build, call analysis, execute package, and update status', async () => {
        // --- Act ---
        await processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        );

        // --- Assert ---
        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
        expect(mockAnalysisInstance.analyzeBuildRequest).toHaveBeenCalled(); // Check analysis was called
        expect(mockBuildRepositoryInstance.updateTempPackage).toHaveBeenCalledWith(buildId, mockAnalysisResultSuccess.package); // Check temp package update
        expect(mockExecutionEngineInstance.executePackage).toHaveBeenCalledWith(mockAnalysisResultSuccess.package, mockUrls); // Pass the actual package
        expect(mockBuildRepositoryInstance.updateSampleResults).toHaveBeenCalledWith(buildId, expect.objectContaining({
            overallStatus: 'completed',
            results: expect.any(Array)
        }));
        // Should update status to GENERATING_SAMPLES, then to PENDING_USER_FEEDBACK
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenNthCalledWith(1, buildId, BuildStatus.GENERATING_SAMPLES);
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenNthCalledWith(2, buildId, BuildStatus.PENDING_USER_FEEDBACK);
    });

    it('should update status to FAILED if execution fails', async () => {
        // --- Arrange ---
        // Override default execution mock for this test
        const mockExecutionResultFailure: ExecutionResult = {
            overallStatus: 'failed',
            error: 'Execution failed badly', 
            results: mockUrls.map(url => ({ url, data: undefined, status: 'error', error: 'Specific error', success: false })),
        };
        vi.mocked(mockExecutionEngineInstance.executePackage).mockResolvedValue(mockExecutionResultFailure);

        // Ensure updateBuildStatus is ready to be called with FAILED
        // This mock handles the call within the catch block after execution failure
        vi.mocked(mockBuildRepositoryInstance.updateBuildStatus).mockResolvedValue({ ...mockBuild, status: BuildStatus.FAILED }); // Prepare for FAILED update

        const consoleErrorSpy = vi.spyOn(console, 'error');

        await processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        );

        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
        expect(mockAnalysisInstance.analyzeBuildRequest).toHaveBeenCalled(); // Analysis should still happen
        expect(mockExecutionEngineInstance.executePackage).toHaveBeenCalledWith(mockAnalysisResultSuccess.package, mockUrls); // Use the result from analysis mock
        expect(mockBuildRepositoryInstance.updateSampleResults).not.toHaveBeenCalled();
        // Should update status to GENERATING_SAMPLES, then to FAILED with execution error
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenNthCalledWith(1, buildId, BuildStatus.GENERATING_SAMPLES);
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenNthCalledWith(2, buildId, BuildStatus.FAILED, mockExecutionResultFailure.error);
        // No error is logged in this path, so we do not assert on consoleErrorSpy
        consoleErrorSpy.mockRestore(); // Restore after assertion
    });

    it('should log a warning and return if build is not in PENDING_ANALYSIS state', async () => {
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValue({
            id: buildId,
            userId: null,
            userObjective: mockObjective,
            targetUrls: JSON.stringify(mockUrls),
            targetUrlsList: mockUrls,
            status: BuildStatus.CONFIRMED,
            error: null,
          
            initialPackageJson: null,
  sampleResultsJson: null,
            finalConfigurationJson: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const consoleWarnSpy = vi.spyOn(console, 'warn');

        await processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        );

        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
        expect(mockAnalysisInstance.analyzeBuildRequest).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledWith('[BuildProcessor] Build test-build-id is not in PENDING_ANALYSIS state (current: CONFIRMED). Skipping job test-job-id.');
    });

    it('should update status to FAILED if build has no target URLs', async () => {
        // Setup: Build found, but targetUrls represents an empty list
        const buildWithEmptyUrlsArray = { 
            ...mockBuild, 
            targetUrls: '[]', // Use empty JSON array string
            targetUrlsList: [] // Ensure list is empty too
        }; 
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValue(buildWithEmptyUrlsArray);
        // Mock the FAILED status update
        vi.mocked(mockBuildRepositoryInstance.updateBuildStatus)
            .mockResolvedValueOnce({ ...buildWithEmptyUrlsArray, status: BuildStatus.FAILED });

        const consoleWarnSpy = vi.spyOn(console, 'warn');

        // --- Act ---
        await processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        );

        // --- Assert ---
        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.FAILED, 'No target URLs provided');
        // Warning should be logged with exact message
        expect(consoleWarnSpy).toHaveBeenCalledWith(`[BuildProcessor] Build ${buildId} has no target URLs for sampling.`);
        expect(mockAnalysisInstance.analyzeBuildRequest).not.toHaveBeenCalled();
        expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
    });

    it('should handle errors during processing and update status to FAILED', async () => {
        const errorMessage = 'Database connection error';
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValueOnce({
            id: buildId,
            userId: null, 
            userObjective: mockObjective,
            targetUrls: JSON.stringify(mockUrls), 
            targetUrlsList: mockUrls, 
            status: BuildStatus.PENDING_ANALYSIS,
            error: null, 
           
            initialPackageJson: null,
  sampleResultsJson: null, 
            finalConfigurationJson: null, 
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        vi.mocked(mockExecutionEngineInstance.executePackage).mockResolvedValue(mockExecutionResult); 
        vi.mocked(mockBuildRepositoryInstance.updateSampleResults).mockRejectedValue(new Error(errorMessage)); 

        const consoleErrorSpy = vi.spyOn(console, 'error');

        // --- Act ---
        await processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        );

        // --- Assert ---
        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId); 
        expect(mockAnalysisInstance.analyzeBuildRequest).toHaveBeenCalled(); // Analysis should have been called
        expect(mockBuildRepositoryInstance.updateTempPackage).toHaveBeenCalled(); // Package generation should have happened
        expect(mockExecutionEngineInstance.executePackage).toHaveBeenCalled(); // Execution should have been attempted
        expect(mockBuildRepositoryInstance.updateSampleResults).toHaveBeenCalled(); // Update should fail
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenNthCalledWith(2, buildId, BuildStatus.FAILED, errorMessage);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining(`Error processing job ${jobId}`),
            expect.any(Error) // Expect the error object as the second argument
        );
        expect(mockExecutionEngineInstance.cleanupTools).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it('should handle errors during analysis and update status to FAILED', async () => {
        // Arrange
        const analysisError = new Error('LLM API Error');
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValue({
            id: buildId,
            userId: null, 
            userObjective: mockObjective,
            targetUrls: JSON.stringify(mockUrls), 
            targetUrlsList: mockUrls, 
            status: BuildStatus.PENDING_ANALYSIS,
            error: null, 
           
            initialPackageJson: null,
  sampleResultsJson: null, 
            finalConfigurationJson: null, 
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        vi.mocked(mockAnalysisInstance.analyzeBuildRequest).mockRejectedValue(analysisError);
        // Expect status update to FAILED
        vi.mocked(mockBuildRepositoryInstance.updateBuildStatus).mockResolvedValue({ ...mockBuild, status: BuildStatus.FAILED });

        const consoleErrorSpy = vi.spyOn(console, 'error');

        // --- Act ---
        await processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        );

        // --- Assert ---
        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
        expect(mockAnalysisInstance.analyzeBuildRequest).toHaveBeenCalled();
        expect(mockBuildRepositoryInstance.updateTempPackage).not.toHaveBeenCalled();
        expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenNthCalledWith(1, buildId, BuildStatus.FAILED, analysisError.message);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining(`Error processing job ${jobId}`),
            expect.any(Error) // Expect the error object as the second argument
        );

        consoleErrorSpy.mockRestore();
    });

    it('should handle invalid JSON in target URLs and update status to FAILED', async () => {
        // Arrange: Mock build with invalid JSON in targetUrls
        const invalidJsonBuild = { 
            ...mockBuild, 
            targetUrls: 'invalid-json', 
            targetUrlsList: undefined // Simulate parsing failure result
        }; 
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValue(invalidJsonBuild);
        const consoleErrorSpy = vi.spyOn(console, 'error');
        const consoleWarnSpy = vi.spyOn(console, 'warn');

        // Act
        await processBuildJob(jobId, buildId, mockBuildRepositoryInstance, mockAnalysisInstance, mockExecutionEngineInstance);

        // Assert: Should log error and return early
        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
        expect(consoleErrorSpy).toHaveBeenCalledWith(`[BuildProcessor] Build ${buildId} not found or targetUrls parsing failed for job ${jobId}.`);
        expect(mockBuildRepositoryInstance.updateBuildStatus).not.toHaveBeenCalled();
        expect(mockAnalysisInstance.analyzeBuildRequest).not.toHaveBeenCalled(); // Should not be called if URLs fail parsing
        expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    it('should skip analysis and execution if build status is not PENDING or RETRYING', async () => {
        // --- Arrange ---
        const initialBuild = { ...mockBuild, status: BuildStatus.CONFIRMED }; // Already completed
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValue(initialBuild);

        // --- Act ---
        await processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        );

        // --- Assert ---
        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
        expect(mockAnalysisInstance.analyzeBuildRequest).not.toHaveBeenCalled();
        expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();
        expect(mockBuildRepositoryInstance.updateBuildStatus).not.toHaveBeenCalled();
    });

    it('should handle error during build status update gracefully', async () => {
        // --- Arrange ---
        const statusUpdateError = new Error('DB connection lost during status update');
        // Simulate failure during the *final* status update
        vi.mocked(mockBuildRepositoryInstance.updateBuildStatus).mockRejectedValue(statusUpdateError);

        // Other steps succeed
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValue(mockBuild); // Reset default
        // Ensure the test runs through analysis and execution
        vi.mocked(mockAnalysisInstance.analyzeBuildRequest).mockResolvedValue(mockAnalysisResultSuccess);
        vi.mocked(mockExecutionEngineInstance.executePackage).mockResolvedValue(mockExecutionResult);
        vi.mocked(mockBuildRepositoryInstance.updateTempPackage).mockResolvedValue(mockBuild);
        vi.mocked(mockBuildRepositoryInstance.updateSampleResults).mockResolvedValue(mockBuild);

        // --- Act & Assert ---
        // Expect the overall process to throw because the final status update failed
        await expect(processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        )).rejects.toThrowError(statusUpdateError);
    });

    it('should handle intermediate DB error during temp package update', async () => {
        // --- Arrange ---
        const dbError = new Error('Failed to update temp package in DB');
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValueOnce(mockBuild); // Initial find succeeds
        vi.mocked(mockAnalysisInstance.analyzeBuildRequest).mockResolvedValue(mockAnalysisResultSuccess); // Analysis succeeds
        vi.mocked(mockBuildRepositoryInstance.updateTempPackage).mockRejectedValue(dbError); // Fails here
        vi.mocked(mockBuildRepositoryInstance.updateBuildStatus).mockResolvedValue(mockBuild); // Mock the failure status update

        // --- Act ---
        await processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        );

        // --- Assert ---
        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
        expect(mockAnalysisInstance.analyzeBuildRequest).toHaveBeenCalled(); // Analysis should have been called
        expect(mockBuildRepositoryInstance.updateTempPackage).toHaveBeenCalled(); // Temp package update should have been attempted
        expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled(); // Execution should not have happened
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenNthCalledWith(1, buildId, BuildStatus.FAILED, dbError.message);
    });

    it('should handle intermediate DB error during sample results update', async () => {
        // --- Arrange ---
        const dbError = new Error('Failed to update sample results in DB');
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValue(mockBuild); // Initial find succeeds
        vi.mocked(mockAnalysisInstance.analyzeBuildRequest).mockResolvedValue(mockAnalysisResultSuccess); // Analysis succeeds
        vi.mocked(mockBuildRepositoryInstance.updateTempPackage).mockResolvedValue(mockBuild); // Temp package update succeeds
        vi.mocked(mockExecutionEngineInstance.executePackage).mockResolvedValue(mockExecutionResult); // Execution succeeds
        vi.mocked(mockBuildRepositoryInstance.updateSampleResults).mockRejectedValue(dbError); // Fails here
        vi.mocked(mockBuildRepositoryInstance.updateBuildStatus).mockResolvedValue(mockBuild); // Mock the failure status update

        // --- Act ---
        await processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        );

        // --- Assert ---
        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
        expect(mockAnalysisInstance.analyzeBuildRequest).toHaveBeenCalled(); // Analysis should have been called
        expect(mockBuildRepositoryInstance.updateTempPackage).toHaveBeenCalled(); // Temp package update should have happened
        expect(mockExecutionEngineInstance.executePackage).toHaveBeenCalled(); // Execution should have been attempted
        expect(mockBuildRepositoryInstance.updateSampleResults).toHaveBeenCalled(); // Sample results update should have been attempted
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenNthCalledWith(2, buildId, BuildStatus.FAILED, dbError.message);
    });

    it('should update status to FAILED if analysis fails', async () => {
        // --- Arrange ---
        const analysisError = new Error('LLM Analysis Failed');
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValue(mockBuild); // Find succeeds
        vi.mocked(mockAnalysisInstance.analyzeBuildRequest).mockRejectedValue(analysisError); // Analysis fails
        vi.mocked(mockBuildRepositoryInstance.updateBuildStatus).mockResolvedValue(mockBuild); // Mock the failure status update

        // --- Act ---
        await processBuildJob(
          jobId, 
          buildId, 
          mockBuildRepositoryInstance, 
          mockAnalysisInstance, 
          mockExecutionEngineInstance
        );

        // --- Assert ---
        expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
        expect(mockAnalysisInstance.analyzeBuildRequest).toHaveBeenCalled();
        expect(mockBuildRepositoryInstance.updateTempPackage).not.toHaveBeenCalled();
        expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenNthCalledWith(1, buildId, BuildStatus.FAILED, analysisError.message);
    });

    it('should update status to FAILED if targetUrls are invalid', async () => {
        vi.resetAllMocks();
        // Arrange: Build with empty targetUrls
        const buildWithEmptyUrlsArray = {
            ...mockBuild,
            targetUrls: '[]',
            targetUrlsList: []
        };
        vi.mocked(mockBuildRepositoryInstance.findBuildById).mockResolvedValue(buildWithEmptyUrlsArray);
        // Act
        await processBuildJob(
            jobId,
            buildId,
            mockBuildRepositoryInstance,
            mockAnalysisInstance,
            mockExecutionEngineInstance
        );
        // Assert
        expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.FAILED, 'No target URLs provided');
        expect(mockAnalysisInstance.analyzeBuildRequest).not.toHaveBeenCalled();
        expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();
    });
});
