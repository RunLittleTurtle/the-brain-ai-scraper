// Test for build refinement processing
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient, BuildStatus } from '../../src/generated/prisma/index.js';
import { processRefinementJob } from '../../src/jobs/build.processor.js';
import { BuildRepository } from '../../src/infrastructure/db/build.repository.js';
import { AnalysisService } from '../../src/modules/analysis/analysis.service.js';
import { ExecutionEngineService } from '../../src/infrastructure/execution/execution.service.js';
import { RefinementResult } from '../../src/modules/analysis/analysis.types.js';
import { UniversalConfigurationPackageFormatV1 } from '../../src/core/domain/configuration-package.types.js';
import { createMockPrismaClient } from '../utils/test-db-helper.js';

// Mock dependencies
vi.mock('../../src/modules/analysis/analysis.service.js', () => {
  return {
    AnalysisService: vi.fn().mockImplementation(() => ({
      refineBuildConfiguration: vi.fn()
    }))
  };
});

vi.mock('../../src/infrastructure/execution/execution.service.js', () => {
  return {
    ExecutionEngineService: vi.fn().mockImplementation(() => ({
      executePackage: vi.fn(),
      cleanupTools: vi.fn()
    }))
  };
});

describe('Build Refinement Processor', () => {
  let prisma: PrismaClient;
  let buildRepository: BuildRepository;
  let analysisService: AnalysisService;
  let executionEngine: ExecutionEngineService;
  let testBuildId: string;
  
  // We'll use the test database helper instead of a direct connection

  // Test data
  const initialPackage: UniversalConfigurationPackageFormatV1 = {
    schemaVersion: '1.0',
    description: 'Extract product data',
    scraper: {
      tool_id: 'scraper:fetch_cheerio_v1',
      parameters: {
        selectors: {
          title: 'h1.product-title',
          price: '.price'
        }
      }
    },
    expectedOutputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        price: { type: 'string' }
      }
    }
  };

  const refinedPackage: UniversalConfigurationPackageFormatV1 = {
    schemaVersion: '1.0',
    description: 'Extract product data',
    scraper: {
      tool_id: 'scraper:playwright_stealth_v1',
      parameters: {
        selectors: {
          title: 'h1.product-title',
          price: '.price-dynamic'
        },
        wait: 1000
      }
    },
    expectedOutputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        price: { type: 'string' }
      }
    }
  };

  const sampleResults = [
    { url: 'https://example.com/product1', data: { title: 'Product 1' }, success: true }
  ];

  const userFeedback = {
    feedback: 'Price is missing. Try a different selector or tool.',
    tool_hints: ['Try Playwright'],
    timestamp: new Date().toISOString()
  };

  const executionResult = {
    results: [
      {
        url: 'https://example.com/product1',
        data: { title: 'Product 1', price: '$19.99' },
        success: true
      }
    ],
    overallStatus: 'success',
    error: null
  };

  beforeEach(async () => {
    // Set up a mock PrismaClient for each test
    prisma = createMockPrismaClient() as unknown as PrismaClient;
    buildRepository = new BuildRepository(prisma);
    analysisService = new AnalysisService(null as any, null as any, null as any);
    executionEngine = new ExecutionEngineService(null as any, null as any);
    
    // Setup mock for a test build
    testBuildId = 'test-refinement-build-1';
    const testBuild = {
      id: testBuildId,
      targetUrls: JSON.stringify(['https://example.com/product1']),
      userObjective: 'Extract product data',
      status: BuildStatus.PROCESSING_FEEDBACK,
      initialPackageJson: initialPackage,
      sampleResultsJson: sampleResults,
      userFeedbackJson: userFeedback,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'test-user'
    };
    
    // Setup findUnique mock to return our test build
    prisma.build.findUnique = vi.fn().mockResolvedValue(testBuild);
    
    // Setup update mock to simulate successful update
    prisma.build.update = vi.fn().mockImplementation(({ data }) => {
      return {
        ...testBuild,
        ...data,
        updatedAt: new Date()
      };
    });

    // Mock services
    (analysisService.refineBuildConfiguration as any).mockResolvedValue({
      success: true,
      package: refinedPackage
    } as RefinementResult);

    (executionEngine.executePackage as any).mockResolvedValue(executionResult);
    (executionEngine.cleanupTools as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Clear the mocks after each test
    vi.clearAllMocks();
  });  

  it('should process a refinement job successfully', async () => {
    // Execute the refinement job
    await processRefinementJob(
      'test-job-id',
      testBuildId,
      buildRepository,
      analysisService,
      executionEngine
    );

    // Verify refinement was called with correct parameters
    expect(analysisService.refineBuildConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({
        buildId: testBuildId,
        userFeedback: 'Price is missing. Try a different selector or tool.'
      })
    );

    // Verify execution was called with refined package
    expect(executionEngine.executePackage).toHaveBeenCalledWith(
      refinedPackage,
      ['https://example.com/product1']
    );

    // Verify build was updated correctly
    const updatedBuild = await prisma.build.findUnique({
      where: { id: testBuildId }
    });

    expect(updatedBuild).not.toBeNull();
    expect(updatedBuild?.status).toBe(BuildStatus.PENDING_USER_FEEDBACK);
    
    // Verify sample results were updated
    expect(updatedBuild?.sampleResultsJson).toBeDefined();
  });

  it('should handle refinement failure and update build status', async () => {
    // Mock refinement to fail
    (analysisService.refineBuildConfiguration as any).mockRejectedValue(new Error('Failed to refine package'));

    // Setup mock build update
    const failedBuildUpdate = {
      id: testBuildId,
      status: BuildStatus.FAILED,
      error: 'Failed to refine package',
      updatedAt: new Date()
    };
    
    // Setup mock for updateBuildError
    prisma.build.update = vi.fn().mockImplementation(({ data }) => {
      return {
        ...failedBuildUpdate,
        ...data
      };
    });
    
    // Execute the refinement job
    await processRefinementJob(
      'test-job-id',
      testBuildId,
      buildRepository,
      analysisService,
      executionEngine
    );

    // Verify that updateBuildError was called
    expect(prisma.build.update).toHaveBeenCalled();
    
    // Since we're using mocks, verify that the right status would be passed to update
    const updateCall = prisma.build.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe(BuildStatus.FAILED);
  });

  it('should handle execution failure and update build status', async () => {
    // Mock execution failure
    (executionEngine.executePackage as any).mockRejectedValue(new Error('Execution failed'));

    // Execute the refinement job
    await processRefinementJob(
      'test-job-id',
      testBuildId,
      buildRepository,
      analysisService,
      executionEngine
    );

    // Verify build was updated to FAILED status
    const updatedBuild = await prisma.build.findUnique({
      where: { id: testBuildId }
    });

    expect(updatedBuild).not.toBeNull();
    expect(updatedBuild?.status).toBe(BuildStatus.FAILED);
    expect(updatedBuild?.error).toContain('Execution failed');
  });

  it('should handle builds not in PROCESSING_FEEDBACK state', async () => {
    // Setup a new mock build in CONFIRMED state
    const confirmedBuild = {
      id: testBuildId,
      targetUrls: JSON.stringify(['https://example.com/product1']),
      userObjective: 'Extract product data',
      status: BuildStatus.CONFIRMED, // Different state
      initialPackageJson: initialPackage,
      sampleResultsJson: sampleResults,
      userFeedbackJson: userFeedback,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'test-user'
    };
    
    // Update mock to return confirmed build state
    prisma.build.findUnique = vi.fn().mockResolvedValue(confirmedBuild);
    
    // Clear mocks before test
    vi.clearAllMocks();
    
    // Execute the refinement job
    await processRefinementJob(
      'test-job-id',
      testBuildId,
      buildRepository,
      analysisService,
      executionEngine
    );

    // Verify services were not called
    expect(analysisService.refineBuildConfiguration).not.toHaveBeenCalled();
    expect(executionEngine.executePackage).not.toHaveBeenCalled();
    
    // Verify build.update wasn't called (status remained unchanged)
    expect(prisma.build.update).not.toHaveBeenCalled();
  });
});
