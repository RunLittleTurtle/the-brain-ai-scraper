// src/regression/regression.test.ts
// This file is a regression/integration test suite for core flows.
// Always run this file before marking a feature as "In Review" or "Done".
// Expand this file as you add new features or modules!

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processBuildJob } from '../jobs/build.processor.js';
// Remove dependency on generated Prisma client for enums in test context
// Define BuildStatus locally for test isolation and robustness
const BuildStatus = {
  PENDING_ANALYSIS: 'PENDING_ANALYSIS',
  GENERATING_SAMPLES: 'GENERATING_SAMPLES',
  PENDING_USER_FEEDBACK: 'PENDING_USER_FEEDBACK',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  PROCESSING_FEEDBACK: 'PROCESSING_FEEDBACK',
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
import { AnalysisService } from '../modules/analysis/analysis.service.js';

const mockToolboxInstance = {};
const mockOpenaiServiceInstance = {};

// Use a real AnalysisService instance with mocked methods
const mockAnalysisInstance = new AnalysisService(
  mockBuildRepositoryInstance as any,
  mockToolboxInstance as any,
  mockOpenaiServiceInstance as any
);
vi.spyOn(mockAnalysisInstance, 'analyzeBuildRequest').mockImplementation(vi.fn());
import { ExecutionEngineService } from '../infrastructure/execution/execution.service.js';

const mockExecutionEngineInstance = new ExecutionEngineService(mockToolboxInstance as any);
vi.spyOn(mockExecutionEngineInstance, 'executePackage').mockImplementation(vi.fn());
vi.spyOn(mockExecutionEngineInstance, 'cleanupTools').mockImplementation(vi.fn());

const jobId = 'regression-job-id';
const buildId = 'regression-build-id';
const mockBuild = {
  id: buildId,
  status: BuildStatus.PENDING_ANALYSIS,
  targetUrls: '["http://example.com"]',
  targetUrlsList: ["http://example.com"],
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
    vi.resetAllMocks();
    mockBuildRepositoryInstance.findBuildById.mockResolvedValue({...mockBuild});
    (vi.spyOn(mockAnalysisInstance, 'analyzeBuildRequest') as any).mockResolvedValue({...mockAnalysisResult});
    (vi.spyOn(mockExecutionEngineInstance, 'executePackage') as any).mockResolvedValue({...mockExecutionResult});
    (vi.spyOn(mockExecutionEngineInstance, 'cleanupTools') as any).mockResolvedValue(undefined);
    mockBuildRepositoryInstance.updateBuildStatus.mockResolvedValue({...mockBuild});
    mockBuildRepositoryInstance.updateTempPackage.mockResolvedValue({...mockBuild});
    mockBuildRepositoryInstance.updateSampleResults.mockResolvedValue({...mockBuild});
  });

  it('should process a build end-to-end (happy path)', async () => {
    // Debug: log what the mocks will return
    // NOTE: This regression test is now largely redundant with the more comprehensive 'the-brain-app.regression.test.ts'.
// If future refactors make this file obsolete, consider removing it to reduce maintenance burden.
    mockBuildRepositoryInstance.findBuildById.mockResolvedValue({...mockBuild});
    (vi.spyOn(mockAnalysisInstance, 'analyzeBuildRequest') as any).mockResolvedValue({ success: true, package: { ...mockAnalysisResult.package } });
    (vi.spyOn(mockExecutionEngineInstance, 'executePackage') as any).mockResolvedValue({ ...mockExecutionResult });
    (vi.spyOn(mockExecutionEngineInstance, 'cleanupTools') as any).mockResolvedValue(undefined);

    await processBuildJob(
      jobId,
      buildId,
      mockBuildRepositoryInstance,
      mockAnalysisInstance,
      mockExecutionEngineInstance
    );
    expect(mockBuildRepositoryInstance.findBuildById).toHaveBeenCalledWith(buildId);
    expect(mockAnalysisInstance.analyzeBuildRequest).toHaveBeenCalled();
    expect(mockExecutionEngineInstance.executePackage).toHaveBeenCalled();
    expect(mockBuildRepositoryInstance.updateSampleResults).toHaveBeenCalled();
    expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.GENERATING_SAMPLES);
    expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.PENDING_USER_FEEDBACK);
  });

// NOTE: This regression test is now largely redundant with the more comprehensive 'the-brain-app.regression.test.ts'.
// If future refactors make this file obsolete, consider removing it to reduce maintenance burden.


  it('should fail gracefully if no target URLs', async () => {
    mockBuildRepositoryInstance.findBuildById.mockResolvedValue({ ...mockBuild, targetUrls: '[]', targetUrlsList: [] });
    await processBuildJob(
      jobId,
      buildId,
      mockBuildRepositoryInstance,
      mockAnalysisInstance,
      mockExecutionEngineInstance
    );
    expect(mockBuildRepositoryInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.FAILED, 'No target URLs provided');
    expect(mockAnalysisInstance.analyzeBuildRequest).not.toHaveBeenCalled();
    expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();
  });

  // Add more scenarios as you grow!
});
