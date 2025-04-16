// src/regression/the-brain-app.regression.test.ts
// Comprehensive regression suite for The Brain app
// Always run before marking any feature as In Review or Done

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processBuildJob } from '../jobs/build.processor';
// Local BuildStatus enum for test reliability
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
};
const mockAnalysisInstance = { analyzeBuildRequest: vi.fn() };
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
      mockAnalysisInstance,
      mockExecutionEngineInstance
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
      mockAnalysisInstance,
      mockExecutionEngineInstance
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
      mockAnalysisInstance,
      mockExecutionEngineInstance
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
      mockAnalysisInstance,
      mockExecutionEngineInstance
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
      mockAnalysisInstance,
      mockExecutionEngineInstance
    );
    // The real implementation does NOT call updateBuildStatus if parsing fails
    expect(mockBuildRepositoryInstance.updateBuildStatus).not.toHaveBeenCalled();
    expect(mockAnalysisInstance.analyzeBuildRequest).not.toHaveBeenCalled();
    expect(mockExecutionEngineInstance.executePackage).not.toHaveBeenCalled();
  });

  // Add more: status transitions, user confirmation, etc. as the app grows!
});
