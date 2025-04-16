// src/regression/the-brain-app.regression.test.ts
/**
 * Comprehensive integration regression suite for The Brain App.
 * Covers end-to-end flows, error handling, and business logic integration.
 * Always run before marking any feature as In Review or Done.
 *
 * This suite should cover realistic user and system flows, including all major error scenarios.
 * Do not duplicate minimal smoke tests or migration checks here (see regression.test.ts for those).
 */
// If using ESM, use explicit .js extension for type-only imports. If not, use .ts.
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import { PrismaClient } from '../../src/generated/prisma/index.js';
import { processBuildJob } from '../../src/jobs/build.processor.js';
import type { AnalysisResult } from '../../src/modules/analysis/analysis.types.js';// Local BuildStatus enum for test reliability
// ... [rest of file unchanged] ...

// --- Type Contract Regression ---
describe('AnalysisResult type contract', () => {
  it('should allow success=true only if package is present', () => {
    const good: AnalysisResult = {
      success: true,
      package: { schemaVersion: '1.0', description: '', scraper: {}, expectedOutputSchema: {} } as any,
    };
    expect(good.success).toBe(true);
    expect(good.package).toBeDefined();
  });

  it('should allow success=false only if error is present and package is absent', () => {
    const bad: AnalysisResult = {
      success: false,
      error: 'Some error',
      failureReason: 'llm_error',
    };
    expect(bad.success).toBe(false);
    expect(bad.error).toBeDefined();
    expect((bad as any).package).toBeUndefined();
  });

  // This test will fail to compile if the type contract is violated
  // Uncommenting this should cause a TypeScript error:
  // const invalid: AnalysisResult = { success: true, error: 'Should not have error' };
});
// ... [rest of file unchanged] ...
enum BuildStatus {
  PENDING_ANALYSIS = 'PENDING_ANALYSIS',
  GENERATING_SAMPLES = 'GENERATING_SAMPLES',
  PENDING_USER_FEEDBACK = 'PENDING_USER_FEEDBACK',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED'
}


// --- Mocked Service Layer (unit/integration level) --- //
const mockBuildRepositoryInstance = {
  findBuildById: vi.fn(),
  updateBuildStatus: vi.fn(),
  updateTempPackage: vi.fn(),
  updateSampleResults: vi.fn(),
  // Add missing mocks to satisfy IBuildRepository
  createBuild: vi.fn(),
  updateFinalConfiguration: vi.fn(),
};
const mockAnalysisInstance = {
  analyzeBuildRequest: vi.fn(),
  // Add missing properties to satisfy AnalysisService type
  buildRepository: undefined as any, // Mocked separately where needed
  toolbox: undefined as any, // Mock if needed for specific tests
  openaiService: undefined as any, // Mock if needed
  validateGeneratedPackage: vi.fn(), // Mock private method
};
const mockExecutionEngineInstance = {
  executePackage: vi.fn(),
  cleanupTools: vi.fn().mockResolvedValue(undefined),
};

const jobId = 'regression-job-id';
const buildId = 'regression-build-id';
const mockBuild = {
  id: buildId,
  status: BuildStatus.PENDING_ANALYSIS,
  targetUrls: '["http://example.com"]',
  targetUrlsList: ["http://example.com"],
  userObjective: 'Test objective',
};

const mockAnalysisResult = {
  success: true,
  package: {
    schemaVersion: '1.0',
    description: 'Regression test package',
    scraper: {
      tool_id: 'scraper:fetch_cheerio_v1',
      parameters: { selectors: { title: 'h1' } },
    },
    expectedOutputSchema: {
      type: 'object',
      properties: { title: { type: 'string' } },
      required: ['title'],
    },
  },
};
const mockExecutionResult = {
  overallStatus: 'completed',
  results: [
    { url: 'http://example.com', data: { title: 'Test' }, status: 'success', success: true },
  ],
};

// --- Regression Suite --- //
describe('The Brain App - Regression Suite', () => {
  // --- Infrastructure Checks ---
  // These tests verify essential external dependencies and build processes.
  describe('Infrastructure Checks', () => {
    // Set longer timeouts for these infrastructure-related tests
    const infraTimeoutMs = 300000; // 5 minutes for build
    const dbTimeoutMs = 15000; // 15 seconds for DB connection

    // Podman Build Check
    it('should build the Podman Docker image successfully', () => {
      const projectRoot = path.resolve(__dirname, '..', '..'); // Adjust path relative to this file
      const imageName = 'the-brain-regression-test-image:latest';
      const buildCommand = `podman build -t ${imageName} .`;
      try {
        console.log(`Attempting Podman build for regression test from ${projectRoot}...`);
        execSync(buildCommand, {
          cwd: projectRoot,
          stdio: 'inherit',
          timeout: infraTimeoutMs
        });
        console.log(`Successfully built image: ${imageName}`);
        // Optional cleanup: execSync(`podman rmi ${imageName}`, { cwd: projectRoot, stdio: 'inherit' });
        expect(true).toBe(true);
      } catch (error) {
        console.error('Podman build failed during regression test:', error);
        expect.fail(`Podman build command failed: ${error}`);
      }
    }, infraTimeoutMs);

    // PostgreSQL Connection Check
    describe('Database Connection', () => {
      let prisma: PrismaClient | null = null; // Initialize as null
      const DATABASE_URL_TEST = 'postgresql://postgres:postgres@localhost:5432/brain_db?schema=public';

      beforeAll(() => {
        // Instantiate Prisma Client specifically for this test block
        // Important: Use the direct import path here too
        prisma = new PrismaClient({
          datasources: { db: { url: DATABASE_URL_TEST } },
        });
        console.log('Prisma client instantiated for DB connection test.');
      });

      afterAll(async () => {
        // Disconnect Prisma client after this block's tests
        if (prisma) {
            console.log('Disconnecting Prisma client for DB connection test.');
            await prisma.$disconnect();
            prisma = null; // Clear reference
        }
      });

      it('should connect to the PostgreSQL database successfully', async () => {
        // Reminder: Requires 'db' service from docker-compose to be running
        expect(prisma, 'Prisma client should be instantiated in beforeAll').not.toBeNull();
        try {
          console.log(`Attempting to connect to database for regression test: ${DATABASE_URL_TEST}...`);
          await prisma!.$connect(); // Use non-null assertion
          console.log('Successfully connected to the database for regression test.');
          expect(true).toBe(true);
        } catch (error) {
          console.error('Database connection failed during regression test:', error);
          expect.fail(
            `Failed to connect to the database at ${DATABASE_URL_TEST}. ` +
            `Ensure the PostgreSQL container ('db' service) is running. Error: ${error}`
          );
        }
      }, dbTimeoutMs);
    }); // End Database Connection describe
  }); // End Infrastructure Checks describe

  // --- Core Application Logic Tests ---
  // Reset mocks for these tests as they rely on mocked behavior
  beforeEach(() => {
    vi.resetAllMocks();
    mockBuildRepositoryInstance.findBuildById.mockResolvedValue(mockBuild);
    mockAnalysisInstance.analyzeBuildRequest.mockResolvedValue(mockAnalysisResult);
    mockExecutionEngineInstance.executePackage.mockResolvedValue(mockExecutionResult);
    mockBuildRepositoryInstance.updateBuildStatus.mockResolvedValue(mockBuild);
    mockBuildRepositoryInstance.updateTempPackage.mockResolvedValue(mockBuild);
    mockBuildRepositoryInstance.updateSampleResults.mockResolvedValue(mockBuild);
  });

  it('processes a build end-to-end (happy path)', async () => {
    await processBuildJob(
      jobId,
      buildId,
      mockBuildRepositoryInstance,
      mockAnalysisInstance as any, // Cast to any
      mockExecutionEngineInstance as any // Cast to any
    );
    expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
    expect(mockAnalysisInstance.analyzeBuildRequest).toHaveBeenCalledWith({
      buildId,
      targetUrls: mockBuild.targetUrlsList,
      userObjective: mockBuild.userObjective,
    });
    expect(mockExecutionEngineInstance.executePackage).toHaveBeenCalledWith(
      mockAnalysisResult.package,
      mockBuild.targetUrlsList
    );
    expect(mockBuildRepositoryInstance.updateSampleResults).toHaveBeenCalledWith(
      buildId,
      expect.objectContaining({ results: expect.any(Array) })
    );
    expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(
      buildId,
      BuildStatus.GENERATING_SAMPLES
    );
    expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(
      buildId,
      BuildStatus.PENDING_USER_FEEDBACK
    );
  });

  it('fails gracefully if no target URLs', async () => {
    mockBuildRepositoryInstance.findBuildById.mockResolvedValue({ ...mockBuild, targetUrls: '[]', targetUrlsList: [] });
    await processBuildJob(
      jobId,
      buildId,
      mockBuildRepositoryInstance,
      mockAnalysisInstance as any, // Cast to any
      mockExecutionEngineInstance as any // Cast to any
    );
    expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(
      buildId,
      BuildStatus.FAILED,
      'No target URLs provided'
    );
    expect(mockAnalysisInstance.analyzeBuildRequest).not.toHaveBeenCalled();
    expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();
  });

  it('handles analysis (LLM) failure', async () => {
    mockAnalysisInstance.analyzeBuildRequest.mockRejectedValue(new Error('LLM API Error'));
    await processBuildJob(
      jobId,
      buildId,
      mockBuildRepositoryInstance,
      mockAnalysisInstance as any, // Cast to any
      mockExecutionEngineInstance as any // Cast to any
    );
    expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(
      buildId,
      BuildStatus.FAILED,
      'LLM API Error'
    );
  });

  it('handles execution failure', async () => {
    // Ensure analysis passes
    mockAnalysisInstance.analyzeBuildRequest.mockResolvedValue({ ...mockAnalysisResult });
    // Simulate execution failure
    mockExecutionEngineInstance.executePackage.mockResolvedValue({ overallStatus: 'failed', error: 'Execution failed' });
    await processBuildJob(
      jobId,
      buildId,
      mockBuildRepositoryInstance,
      mockAnalysisInstance as any, // Cast to any
      mockExecutionEngineInstance as any // Cast to any
    );
    expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(
      buildId,
      BuildStatus.FAILED,
      'Execution failed'
    );
  });

  it('handles invalid JSON in targetUrls', async () => {
    mockBuildRepositoryInstance.findBuildById.mockResolvedValue({ ...mockBuild, targetUrls: 'not a json', targetUrlsList: undefined });
    await processBuildJob(
      jobId,
      buildId,
      mockBuildRepositoryInstance,
      mockAnalysisInstance as any, // Cast to any
      mockExecutionEngineInstance as any // Cast to any
    );
    // The real implementation does NOT call updateBuildStatus if parsing fails
    expect(mockBuildRepositoryInstance.updateBuildStatus).not.toHaveBeenCalled();
    expect(mockAnalysisInstance.analyzeBuildRequest).not.toHaveBeenCalled();
    expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();
  });

  // Add more: status transitions, user confirmation, etc. as the app grows!
});
