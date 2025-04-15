import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processBuildJob } from './build.processor.js';
import { Build, BuildStatus, PrismaClient } from '../generated/prisma/index.js'; 
import { BuildRepository as OriginalBuildRepository, IBuildRepository } from '../infrastructure/db/build.repository.js'; 
import { ExecutionResult } from '../infrastructure/execution/execution.service.js'; 
import { UniversalConfigurationPackageFormatV1 } from '../core/domain/configuration-package.types.js';

// --- Mock Dependencies --- 

// Mock the repository module - Define methods INSIDE factory
vi.mock('../infrastructure/db/build.repository.js', () => { 
  const mockMethods = { // Define methods inside factory
    findBuildById: vi.fn(),
    updateBuildStatus: vi.fn(),
    updateTempPackage: vi.fn(),
    updateSampleResults: vi.fn(),
    createBuild: vi.fn(),
    updateUserFeedback: vi.fn(),
  };
  return {
    BuildRepository: vi.fn(() => mockMethods), 
    mockRepositoryMethods: mockMethods 
  }
});

// Mock the execution engine service module - Mock the Class and export mock methods
const mockExecutePackage = vi.fn();
const mockCleanupTools = vi.fn();

vi.mock('../infrastructure/execution/execution.service.js', () => {
  // Mock the class
  const MockExecutionEngineService = vi.fn().mockImplementation(() => {
    return {
      executePackage: mockExecutePackage,
      cleanupTools: mockCleanupTools,
    };
  });

  return {
    ExecutionEngineService: MockExecutionEngineService, // Mock the class export
    // Also need to export ExecutionResult if the original module does
    ExecutionResult: vi.fn() // Or keep the actual type if needed
  };
});

// --- Test Suite --- 

describe('processBuildJob', () => {
  let mockRepoInstance: IBuildRepository;

  beforeEach(async () => {
    const { BuildRepository: MockedBuildRepository } = await import('../infrastructure/db/build.repository.js');
    mockRepoInstance = new MockedBuildRepository({} as PrismaClient); 
    vi.clearAllMocks();
  });

  const buildId = 'test-build-id';
  const jobId = 'test-job-id';
  const mockUrls = ['http://example.com', 'http://example.org'];
  const mockObjective = 'Get titles';

  const mockPendingBuild: Build & { targetUrlsList: string[] } = { 
    id: buildId,
    userId: null, 
    userObjective: mockObjective,
    targetUrls: JSON.stringify(mockUrls),
    targetUrlsList: mockUrls, 
    status: BuildStatus.PENDING_ANALYSIS,
    error: null, 
    tempPackageJson: null, 
    sampleResultsJson: null, 
    finalConfigurationJson: null, 
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExecutionResultSuccess: ExecutionResult = {
    overallStatus: 'completed',
    results: mockUrls.map(url => ({ url, data: { title: 'Mock Title' }, status: 'success', success: true, error: undefined })),
  };

  const mockExecutionResultFailure: ExecutionResult = {
    overallStatus: 'failed',
    error: 'Execution failed badly', 
    results: mockUrls.map(url => ({ url, data: undefined, status: 'error', error: 'Specific error', success: false })),
  };

  it('should successfully process a build, execute package, and update status to PENDING_USER_FEEDBACK', async () => {
    vi.mocked(mockRepoInstance.findBuildById).mockResolvedValue(mockPendingBuild);
    mockExecutePackage.mockResolvedValue(mockExecutionResultSuccess);
    vi.mocked(mockRepoInstance.findBuildById).mockResolvedValueOnce(mockPendingBuild) 
                                             .mockResolvedValueOnce({...mockPendingBuild, status: BuildStatus.PENDING_USER_FEEDBACK}); 

    await processBuildJob(jobId, buildId);

    expect(mockRepoInstance.findBuildById).toHaveBeenCalledWith(buildId);
    expect(mockRepoInstance.updateTempPackage).toHaveBeenCalledWith(buildId, expect.any(Object)); 
    expect(mockRepoInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.GENERATING_SAMPLES);
    expect(mockExecutePackage).toHaveBeenCalledWith(expect.any(Object), mockUrls); 
    expect(mockRepoInstance.updateSampleResults).toHaveBeenCalledWith(buildId, mockExecutionResultSuccess);
    expect(mockRepoInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.PENDING_USER_FEEDBACK, undefined);
    expect(mockRepoInstance.findBuildById).toHaveBeenCalledTimes(2);
    expect(mockCleanupTools).toHaveBeenCalled();
  });

  it('should update status to FAILED if execution fails', async () => {
    vi.mocked(mockRepoInstance.findBuildById).mockResolvedValue(mockPendingBuild);
    mockExecutePackage.mockResolvedValue(mockExecutionResultFailure);
    vi.mocked(mockRepoInstance.findBuildById).mockResolvedValueOnce(mockPendingBuild) 
                                             .mockResolvedValueOnce({...mockPendingBuild, status: BuildStatus.FAILED}); 

    await processBuildJob(jobId, buildId);

    expect(mockRepoInstance.findBuildById).toHaveBeenCalledWith(buildId);
    expect(mockRepoInstance.updateTempPackage).toHaveBeenCalled();
    expect(mockRepoInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.GENERATING_SAMPLES);
    expect(mockExecutePackage).toHaveBeenCalled();
    expect(mockRepoInstance.updateSampleResults).toHaveBeenCalledWith(buildId, mockExecutionResultFailure);
    expect(mockRepoInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.FAILED, mockExecutionResultFailure.error);
    expect(mockRepoInstance.findBuildById).toHaveBeenCalledTimes(2);
    expect(mockCleanupTools).toHaveBeenCalled();
  });

  it('should log an error and return if build is not found', async () => {
    vi.mocked(mockRepoInstance.findBuildById).mockResolvedValue(null);
    const consoleErrorSpy = vi.spyOn(console, 'error');

    await processBuildJob(jobId, buildId);

    expect(mockRepoInstance.findBuildById).toHaveBeenCalledWith(buildId);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Build ${buildId} not found`));
    expect(mockRepoInstance.updateBuildStatus).not.toHaveBeenCalled();
    expect(mockExecutePackage).not.toHaveBeenCalled();
    expect(mockCleanupTools).not.toHaveBeenCalled(); 

    consoleErrorSpy.mockRestore();
  });

  it('should log a warning and return if build is not in PENDING_ANALYSIS state', async () => {
    const wrongStatusBuild = { ...mockPendingBuild, status: BuildStatus.CONFIRMED }; 
    vi.mocked(mockRepoInstance.findBuildById).mockResolvedValue(wrongStatusBuild);
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    await processBuildJob(jobId, buildId);

    expect(mockRepoInstance.findBuildById).toHaveBeenCalledWith(buildId);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining(`not in PENDING_ANALYSIS state`));
    expect(mockRepoInstance.updateBuildStatus).not.toHaveBeenCalled();
    expect(mockExecutePackage).not.toHaveBeenCalled();
    expect(mockCleanupTools).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should update status to FAILED if build has no target URLs', async () => {
    const noUrlsBuild: Build & { targetUrlsList: string[] } = { 
      ...mockPendingBuild, 
      targetUrlsList: [],
      targetUrls: '[]' 
    };
    vi.mocked(mockRepoInstance.findBuildById).mockResolvedValue(noUrlsBuild);
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    await processBuildJob(jobId, buildId);

    expect(mockRepoInstance.findBuildById).toHaveBeenCalledWith(buildId);
    expect(mockRepoInstance.updateTempPackage).toHaveBeenCalled(); 
    expect(mockRepoInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.GENERATING_SAMPLES);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining(`has no target URLs for sampling`));
    expect(mockExecutePackage).not.toHaveBeenCalled();
    expect(mockRepoInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.FAILED, 'No target URLs provided');
    expect(mockRepoInstance.findBuildById).toHaveBeenCalledTimes(1);
    expect(mockCleanupTools).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should handle errors during processing and update status to FAILED', async () => {
    const errorMessage = 'Database connection error';
    vi.mocked(mockRepoInstance.findBuildById).mockResolvedValueOnce(mockPendingBuild);
    mockExecutePackage.mockResolvedValue(mockExecutionResultSuccess); 
    vi.mocked(mockRepoInstance.updateSampleResults).mockRejectedValue(new Error(errorMessage)); 

    const consoleErrorSpy = vi.spyOn(console, 'error');

    await processBuildJob(jobId, buildId);

    expect(mockRepoInstance.findBuildById).toHaveBeenCalledWith(buildId); 
    expect(mockRepoInstance.updateTempPackage).toHaveBeenCalled(); 
    expect(mockRepoInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.GENERATING_SAMPLES);
    expect(mockExecutePackage).toHaveBeenCalled(); 
    expect(mockRepoInstance.updateSampleResults).toHaveBeenCalled(); 
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error processing job'), expect.any(Error));
    expect(mockRepoInstance.updateBuildStatus).toHaveBeenCalledWith(buildId, BuildStatus.FAILED, errorMessage); 
    expect(mockRepoInstance.updateBuildStatus).toHaveBeenCalledTimes(2);
    expect(mockRepoInstance.findBuildById).toHaveBeenCalledTimes(1); 
    expect(mockCleanupTools).toHaveBeenCalled();


    consoleErrorSpy.mockRestore();
  });
});
