// src/regression/regression.test.ts
/**
 * Minimal smoke test and migration regression suite for The Brain App.
 * Use this suite to quickly verify that core flows and database migrations are working after major upgrades or schema changes.
 *
 * If this file becomes redundant with the-brain-app.regression.test.ts, consider removing it to reduce maintenance burden.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processBuildJob } from '../../src/jobs/build.processor.js';
import { IToolbox } from '../../src/core/interfaces/toolbox.interface.js'; 
import { IBuildRepository } from '../../src/infrastructure/db/build.repository.js';
import { BuildStatus, Build } from '../../src/generated/prisma/index.js';
import { ToolboxService } from '../../src/infrastructure/toolbox/toolbox.service.js'; // Import ToolboxService
import { AnalysisService } from '../../src/modules/analysis/analysis.service.js'; // Import AnalysisService

// Mock the AnalysisService module
const mockAnalyzeBuildRequest = vi.fn(); // The specific method we want to track

// Define as a simple object literal mock
const mockAnalysisInstance = {
  analyzeBuildRequest: mockAnalyzeBuildRequest,
  // Add other methods from AnalysisService that processBuildJob might call if needed
};

// Mock dependencies (reuse your mocks from build.processor.test.ts)
const mockBuildRepositoryInstance = {
  findBuildById: vi.fn(),
  updateBuildStatus: vi.fn(),
  updateTempPackage: vi.fn(),
  updateSampleResults: vi.fn(),
  createBuild: vi.fn(),
  updateFinalConfiguration: vi.fn(),
};

// Provide a type-safe mock adhering to the IToolbox interface
const mockIToolboxInstance: Partial<IToolbox> = { // Renamed for clarity
  getTool: vi.fn(),
  listTools: vi.fn(),
};

// Mock for the concrete ToolboxService
const mockToolboxServiceInstance: Partial<ToolboxService> = {
  getTool: vi.fn(),
  listTools: vi.fn(),
  listMcpTools: vi.fn(),
  callTool: vi.fn(),
  registerTool: vi.fn(),
  registerDefaultTools: vi.fn(),
};

const mockOpenaiServiceInstance = {};

import { ExecutionEngineService } from '../../src/infrastructure/execution/execution.service.js';

// Pass BOTH mocks to the constructor
const mockExecutionEngineInstance = new ExecutionEngineService(
  mockIToolboxInstance as any, // First arg: IToolbox mock
  mockToolboxServiceInstance as any // Second arg: ToolboxService mock
);
vi.spyOn(mockExecutionEngineInstance, 'executePackage').mockImplementation(vi.fn());
vi.spyOn(mockExecutionEngineInstance, 'cleanupTools').mockImplementation(vi.fn());

const jobId = 'regression-job-id';
const buildId = 'regression-build-id';

const mockBuild: Partial<Build> & { targetUrlsList?: string[] } = {
  id: buildId,
  status: BuildStatus.PENDING_ANALYSIS,
  targetUrls: '["http://example.com"]', // Keep the JSON string
  targetUrlsList: ['http://example.com'], // Add the parsed list explicitly
  userObjective: 'Test objective',
};

const mockAnalysisResult = { package: { name: 'TestPackage' } };
const mockExecutionResult = {
  overallStatus: 'completed',
  results: [
    { url: 'http://example.com', data: { title: 'Test' }, status: 'success', success: true },
  ],
};

// Regression tests for processBuildJob

describe('Regression Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
    // Setup default mock implementations
    mockBuildRepositoryInstance.findBuildById.mockResolvedValue({...mockBuild});
    mockAnalyzeBuildRequest.mockResolvedValue({ success: true, package: { /* mock package data */ } }); // Mock the module's function
    // Mock ExecutionEngineService methods directly on the instance
    (mockExecutionEngineInstance.executePackage as any).mockResolvedValue({ overallStatus: 'completed', results: [] });
    (mockExecutionEngineInstance.cleanupTools as any).mockResolvedValue(undefined);
  });

  it('should process a build end-to-end (happy path)', async () => {
    await processBuildJob(
      jobId,
      buildId,
      mockBuildRepositoryInstance as any,
      mockAnalysisInstance as any, // Pass the simple mock object literal
      mockExecutionEngineInstance
    );
    expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
    expect(mockAnalyzeBuildRequest).toHaveBeenCalledOnce(); // Assert on the mocked module function
    expect(mockExecutionEngineInstance.executePackage).toHaveBeenCalledOnce();
    expect(mockBuildRepositoryInstance.updateSampleResults).toHaveBeenCalledOnce();
    expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.PENDING_USER_FEEDBACK);
    expect(mockExecutionEngineInstance.cleanupTools).toHaveBeenCalledOnce();
  });

  it('should fail gracefully if no target URLs', async () => {
    // Ensure both targetUrls (string) and targetUrlsList (array) are correctly mocked
    mockBuildRepositoryInstance.findBuildById.mockResolvedValue({ 
      ...mockBuild, 
      targetUrls: '[]', 
      targetUrlsList: [] // Explicitly set empty list
    });
    await processBuildJob(
      jobId,
      buildId,
      mockBuildRepositoryInstance as any,
      mockAnalysisInstance as any, // Pass the simple mock object literal
      mockExecutionEngineInstance
    );
    expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(
      buildId,
      BuildStatus.FAILED,
      'No target URLs provided' // Expect the exact string
    );
    expect(mockAnalyzeBuildRequest).not.toHaveBeenCalled(); // Should not be called
    expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();
    expect(mockExecutionEngineInstance.cleanupTools).not.toHaveBeenCalled(); // Cleanup shouldn't run on early exit
  });

  // Add tests for other failure modes if necessary (analysis failure, execution failure)
});

// NOTE: This regression test is now largely redundant with the more comprehensive 'the-brain-app.regression.test.ts'.
// If future refactors make this file obsolete, consider removing it to reduce maintenance burden.
