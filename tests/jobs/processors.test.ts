/**
 * Test suite for the new modular build processors
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient, BuildStatus } from '@prisma/client';
import { IBuildRepository } from '../../src/infrastructure/db/build.repository.js';
import { AnalysisService } from '../../src/modules/analysis/analysis.service.js';
import { ExecutionEngineService } from '../../src/infrastructure/execution/execution.service.js';
import { 
  createProcessors,
  BuildAnalysisProcessor,
  SampleGenerationProcessor,
  RefinementProcessor, 
  ExecutionProcessor,
  FeedbackType
} from '../../src/jobs/processors/index.js';
import { ErrorCategory } from '../../src/core/domain/error-reporting.types.js';

// Mock dependencies
vi.mock('@prisma/client', () => {
  const BuildStatus = {
    PENDING_ANALYSIS: 'PENDING_ANALYSIS',
    GENERATING_SAMPLES: 'GENERATING_SAMPLES',
    PENDING_USER_FEEDBACK: 'PENDING_USER_FEEDBACK',
    PROCESSING_FEEDBACK: 'PROCESSING_FEEDBACK',
    READY_FOR_SCRAPING: 'READY_FOR_SCRAPING',
    SCRAPING_IN_PROGRESS: 'SCRAPING_IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    ANALYSIS_FAILED: 'ANALYSIS_FAILED'
  };
  
  return { PrismaClient: vi.fn(), BuildStatus };
});

// Create mock repository
const mockBuildRepository = {
  findBuildById: vi.fn(),
  updateBuildStatus: vi.fn(),
  updateBuildError: vi.fn(),
  createBuild: vi.fn(),
  updateTempPackage: vi.fn(),
  updateSampleResults: vi.fn(),
  updateFinalConfiguration: vi.fn(),
  updateUserFeedback: vi.fn()
} as unknown as IBuildRepository;

// Create mock analysis service
const mockAnalysisService = {
  analyzeUserObjective: vi.fn(),
  refineBuildConfiguration: vi.fn()
} as unknown as AnalysisService;

// Create mock execution engine
const mockExecutionEngine = {
  executePackage: vi.fn()
} as unknown as ExecutionEngineService;

// Create mock Prisma client
const mockPrisma = {} as unknown as PrismaClient;

describe('Processor Factory', () => {
  it('should create all processors with proper injection', () => {
    const processors = createProcessors(
      mockBuildRepository,
      mockAnalysisService,
      mockExecutionEngine,
      mockPrisma
    );
    
    expect(processors.analysisProcessor).toBeInstanceOf(BuildAnalysisProcessor);
    expect(processors.sampleProcessor).toBeInstanceOf(SampleGenerationProcessor);
    expect(processors.refinementProcessor).toBeInstanceOf(RefinementProcessor);
    expect(processors.executionProcessor).toBeInstanceOf(ExecutionProcessor);
  });
});

describe('BuildAnalysisProcessor', () => {
  let processor: BuildAnalysisProcessor;
  let sampleProcessor: SampleGenerationProcessor;
  
  beforeEach(() => {
    sampleProcessor = new SampleGenerationProcessor(
      mockBuildRepository,
      mockExecutionEngine,
      mockPrisma
    );
    
    processor = new BuildAnalysisProcessor(
      mockBuildRepository,
      mockAnalysisService,
      sampleProcessor,
      mockPrisma
    );
    
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup default mock behaviors
    mockBuildRepository.findBuildById.mockResolvedValue({
      id: 'test-build-id',
      status: BuildStatus.PENDING_ANALYSIS,
      userObjective: 'Test objective',
      targetUrlsList: ['https://example.com']
    });
    
    mockAnalysisService.analyzeUserObjective.mockResolvedValue({
      configPackage: { schemaVersion: '1.0', description: 'Test config' }
    });
  });
  
  it('should process analysis successfully', async () => {
    // Mock the sample processor to avoid testing it here
    sampleProcessor.process = vi.fn().mockResolvedValue(true);
    
    const result = await processor.process(
      'test-build-id',
      'Test objective',
      ['https://example.com']
    );
    
    expect(result).toBe(true);
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.PENDING_ANALYSIS
    );
    expect(mockAnalysisService.analyzeUserObjective).toHaveBeenCalledWith({
      buildId: 'test-build-id',
      userObjective: 'Test objective',
      urls: ['https://example.com']
    });
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.GENERATING_SAMPLES
    );
    expect(mockBuildRepository.updateTempPackage).toHaveBeenCalled();
    expect(sampleProcessor.process).toHaveBeenCalledWith('test-build-id');
  });
  
  it('should handle errors during analysis', async () => {
    const error = new Error('Analysis failed');
    mockAnalysisService.analyzeUserObjective.mockRejectedValue(error);
    
    const result = await processor.process(
      'test-build-id',
      'Test objective',
      ['https://example.com']
    );
    
    expect(result).toBe(false);
    expect(mockBuildRepository.updateBuildError).toHaveBeenCalled();
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.ANALYSIS_FAILED
    );
  });
});

describe('SampleGenerationProcessor', () => {
  let processor: SampleGenerationProcessor;
  
  beforeEach(() => {
    processor = new SampleGenerationProcessor(
      mockBuildRepository,
      mockExecutionEngine,
      mockPrisma
    );
    
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup default mock behaviors
    mockBuildRepository.findBuildById.mockResolvedValue({
      id: 'test-build-id',
      status: BuildStatus.GENERATING_SAMPLES,
      initialPackageJson: JSON.stringify({ schemaVersion: '1.0', description: 'Test config' }),
      targetUrlsList: ['https://example.com', 'https://example.org', 'https://example.net']
    });
    
    mockExecutionEngine.executePackage.mockResolvedValue({
      results: [{ url: 'https://example.com', data: { title: 'Example' } }]
    });
  });
  
  it('should generate samples successfully', async () => {
    const result = await processor.process('test-build-id');
    
    expect(result).toBe(true);
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.GENERATING_SAMPLES
    );
    expect(mockExecutionEngine.executePackage).toHaveBeenCalledWith(
      expect.objectContaining({ schemaVersion: '1.0', description: 'Test config' }),
      expect.arrayContaining(['https://example.com', 'https://example.org', 'https://example.net'])
    );
    expect(mockBuildRepository.updateSampleResults).toHaveBeenCalled();
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.PENDING_USER_FEEDBACK
    );
  });
  
  it('should handle errors during sample generation', async () => {
    const error = new Error('Sample generation failed');
    mockExecutionEngine.executePackage.mockRejectedValue(error);
    
    const result = await processor.process('test-build-id');
    
    expect(result).toBe(false);
    expect(mockBuildRepository.updateBuildError).toHaveBeenCalled();
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.FAILED
    );
  });
});

describe('RefinementProcessor', () => {
  let processor: RefinementProcessor;
  let sampleProcessor: SampleGenerationProcessor;
  
  beforeEach(() => {
    sampleProcessor = new SampleGenerationProcessor(
      mockBuildRepository,
      mockExecutionEngine,
      mockPrisma
    );
    
    processor = new RefinementProcessor(
      mockBuildRepository,
      mockAnalysisService,
      sampleProcessor,
      mockPrisma
    );
    
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup default mock behaviors
    mockBuildRepository.findBuildById.mockResolvedValue({
      id: 'test-build-id',
      status: BuildStatus.PROCESSING_FEEDBACK,
      initialPackageJson: JSON.stringify({ schemaVersion: '1.0', description: 'Initial config' }),
      finalPackageJson: JSON.stringify({ schemaVersion: '1.0', description: 'Final config' }),
      sampleResultsJson: JSON.stringify([{ url: 'https://example.com', data: { title: 'Example' } }])
    });
    
    mockAnalysisService.refineBuildConfiguration.mockResolvedValue({
      configPackage: { schemaVersion: '1.0', description: 'Refined config' }
    });
    
    // Mock the sample processor to avoid testing it here
    sampleProcessor.process = vi.fn().mockResolvedValue(true);
  });
  
  it('should refine based on proposal feedback and generate new samples', async () => {
    const userFeedback = {
      approved: true,
      additional_fields: ['price'],
      feedback_type: 'proposal_feedback'
    };
    
    const result = await processor.process(
      'test-build-id',
      userFeedback,
      FeedbackType.PROPOSAL_FEEDBACK
    );
    
    expect(result).toBe(true);
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.PROCESSING_FEEDBACK
    );
    expect(mockAnalysisService.refineBuildConfiguration).toHaveBeenCalledWith({
      buildId: 'test-build-id',
      configPackage: expect.objectContaining({ schemaVersion: '1.0', description: 'Final config' }),
      userFeedback
    });
    expect(mockBuildRepository.updateFinalConfiguration).toHaveBeenCalled();
    expect(sampleProcessor.process).toHaveBeenCalledWith('test-build-id');
  });
  
  it('should refine based on sample feedback and mark as ready for scraping', async () => {
    const userFeedback = {
      approved: true,
      field_adjustments: [{ field_name: 'title', issue: 'Missing', suggestion: 'Use h1' }],
      feedback_type: 'sample_feedback'
    };
    
    const result = await processor.process(
      'test-build-id',
      userFeedback,
      FeedbackType.SAMPLE_FEEDBACK
    );
    
    expect(result).toBe(true);
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.PROCESSING_FEEDBACK
    );
    expect(mockAnalysisService.refineBuildConfiguration).toHaveBeenCalledWith({
      buildId: 'test-build-id',
      configPackage: expect.objectContaining({ schemaVersion: '1.0', description: 'Final config' }),
      userFeedback
    });
    expect(mockBuildRepository.updateFinalConfiguration).toHaveBeenCalled();
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.READY_FOR_SCRAPING
    );
    expect(sampleProcessor.process).not.toHaveBeenCalled();
  });
  
  it('should handle errors during refinement', async () => {
    const error = new Error('Refinement failed');
    mockAnalysisService.refineBuildConfiguration.mockRejectedValue(error);
    
    const userFeedback = {
      approved: true,
      field_adjustments: [{ field_name: 'title', issue: 'Missing', suggestion: 'Use h1' }],
      feedback_type: 'sample_feedback'
    };
    
    const result = await processor.process(
      'test-build-id',
      userFeedback,
      FeedbackType.SAMPLE_FEEDBACK
    );
    
    expect(result).toBe(false);
    expect(mockBuildRepository.updateBuildError).toHaveBeenCalled();
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.FAILED
    );
  });
});

describe('ExecutionProcessor', () => {
  let processor: ExecutionProcessor;
  
  beforeEach(() => {
    processor = new ExecutionProcessor(
      mockBuildRepository,
      mockExecutionEngine,
      mockPrisma
    );
    
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup default mock behaviors
    mockBuildRepository.findBuildById.mockResolvedValue({
      id: 'test-build-id',
      status: BuildStatus.READY_FOR_SCRAPING,
      finalPackageJson: JSON.stringify({ schemaVersion: '1.0', description: 'Final config' }),
      targetUrlsList: ['https://example.com', 'https://example.org', 'https://example.net']
    });
    
    mockExecutionEngine.executePackage.mockResolvedValue({
      results: [
        { url: 'https://example.com', data: { title: 'Example 1' } },
        { url: 'https://example.org', data: { title: 'Example 2' } },
        { url: 'https://example.net', data: { title: 'Example 3' } }
      ]
    });
  });
  
  it('should execute full scrape successfully', async () => {
    const result = await processor.process('test-build-id');
    
    expect(result).toBe(true);
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.SCRAPING_IN_PROGRESS
    );
    expect(mockExecutionEngine.executePackage).toHaveBeenCalledWith(
      expect.objectContaining({ schemaVersion: '1.0', description: 'Final config' }),
      expect.arrayContaining(['https://example.com', 'https://example.org', 'https://example.net'])
    );
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.COMPLETED
    );
    expect(mockBuildRepository.updateSampleResults).toHaveBeenCalled();
  });
  
  it('should handle errors during execution', async () => {
    mockBuildRepository.findBuildById.mockResolvedValue({
      id: 'test-build-id',
      finalPackageJson: JSON.stringify({ schemaVersion: '1.0', description: 'Final config' }),
      targetUrls: JSON.stringify(['https://example.com', 'https://example.org', 'https://example.net']),
      status: BuildStatus.CONFIRMED
    });
    
    const error = new Error('Execution failed');
    mockExecutionEngine.executePackage.mockRejectedValue(error);
    
    const result = await processor.process('test-build-id');
    
    expect(result).toBe(false);
    expect(mockBuildRepository.updateBuildError).toHaveBeenCalled();
    expect(mockBuildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-build-id',
      BuildStatus.FAILED
    );
  });
  
  it('should handle builds with no final package by using initial package', async () => {
    mockBuildRepository.findBuildById.mockResolvedValue({
      id: 'test-build-id',
      status: BuildStatus.READY_FOR_SCRAPING,
      finalPackageJson: null,
      initialPackageJson: JSON.stringify({ schemaVersion: '1.0', description: 'Initial config' }),
      targetUrlsList: ['https://example.com']
    });
    
    const result = await processor.process('test-build-id');
    
    expect(result).toBe(true);
    expect(mockExecutionEngine.executePackage).toHaveBeenCalledWith(
      expect.objectContaining({ schemaVersion: '1.0', description: 'Initial config' }),
      expect.arrayContaining(['https://example.com'])
    );
  });
});
