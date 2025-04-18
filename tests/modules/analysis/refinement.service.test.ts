// Set up environment variables for testing
process.env.API_KEY = 'test-key';
process.env.TOOL_ORCHESTRATION_MODE = 'classic'; // Use classic mode for these tests

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createMockPrismaClient } from '../../utils/test-db-helper.js';
import { PrismaClient, BuildStatus } from '../../../src/generated/prisma/index.js';
import { AnalysisService } from '../../../src/modules/analysis/analysis.service.js';
import { RefinementInput } from '../../../src/modules/analysis/analysis.types.js';
import { UniversalConfigurationPackageFormatV1 } from '../../../src/core/domain/configuration-package.types.js';
import { BuildRepository } from '../../../src/infrastructure/db/build.repository.js';
import { OpenaiService } from '../../../src/infrastructure/llm/openai.service.js';
import { ToolboxService } from '../../../src/infrastructure/toolbox/toolbox.service.js';

describe('AnalysisService Refinement Functionality', () => {
  let prisma: PrismaClient;
  let buildRepository: BuildRepository;
  let toolboxService: ToolboxService;
  let openaiService: OpenaiService;
  let analysisService: AnalysisService;

  // Mock packages for testing
  const cheerioPackage: UniversalConfigurationPackageFormatV1 = {
    schemaVersion: '1.0',
    description: 'Extract product names and prices',
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

  const playwrightPackage: UniversalConfigurationPackageFormatV1 = {
    schemaVersion: '1.0',
    description: 'Extract product names and prices',
    scraper: {
      tool_id: 'scraper:playwright_stealth_v1',
      parameters: {
        selectors: {
          title: 'h1.product-title',
          price: '.price'
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

  // Sample results that didn't capture the prices
  const sampleResults = [
    {
      url: 'https://example.com/product1',
      data: {
        title: 'Product 1',
        price: null
      },
      success: true
    },
    {
      url: 'https://example.com/product2',
      data: {
        title: 'Product 2',
        price: null
      },
      success: true
    }
  ];

  beforeAll(async () => {
    // Create mock PrismaClient using our helper
    prisma = createMockPrismaClient();
    
    // Create repository with mocked prisma client
    buildRepository = new BuildRepository(prisma as any);
    
    // Mock the buildRepository methods
    vi.spyOn(buildRepository, 'findBuildById').mockImplementation(async (id) => {
      return {
        id,
        targetUrls: JSON.stringify(['https://example.com/test']),
        userObjective: 'Test objective',
        status: BuildStatus.PROCESSING_FEEDBACK,
        initialPackageJson: JSON.parse(JSON.stringify(cheerioPackage)),
        sampleResultsJson: JSON.parse(JSON.stringify(sampleResults)),
        userFeedbackJson: null,
        finalPackageJson: null,
        errorDetailsJson: null,
        metadata: null,
        error: null,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        targetUrlsList: ['https://example.com/test']
      };
    });
    
    vi.spyOn(buildRepository, 'updateBuildStatus').mockImplementation(async (id, status, error) => {
      return {
        id,
        status,
        error: error || null,
        errorDetailsJson: null,
        metadata: null,
        userId: null,
        targetUrls: JSON.stringify(['https://example.com/test']),
        userObjective: 'Test objective',
        initialPackageJson: JSON.parse(JSON.stringify(cheerioPackage)),
        sampleResultsJson: JSON.parse(JSON.stringify(sampleResults)),
        userFeedbackJson: null,
        finalPackageJson: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    vi.spyOn(buildRepository, 'updateFinalConfiguration').mockImplementation(async (id, finalPackage) => {
      return {
        id,
        status: BuildStatus.CONFIRMED,
        error: null,
        errorDetailsJson: null,
        metadata: null,
        userId: null,
        targetUrls: JSON.stringify(['https://example.com/test']),
        userObjective: 'Test objective',
        initialPackageJson: JSON.parse(JSON.stringify(cheerioPackage)),
        finalPackageJson: JSON.parse(JSON.stringify(finalPackage)),
        sampleResultsJson: JSON.parse(JSON.stringify(sampleResults)),
        userFeedbackJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  });

  beforeEach(() => {
    // Mock the Toolbox Service
    toolboxService = {
      listTools: vi.fn().mockReturnValue([
        { toolId: 'scraper:fetch_cheerio_v1', description: 'Simple DOM parser using Cheerio' },
        { toolId: 'scraper:playwright_stealth_v1', description: 'Headless browser with anti-detection' }
      ]),
      getToolById: vi.fn()
    } as any;

    // Mock the OpenAI Service
    openaiService = {
      generateInitialPackage: vi.fn(),
      refinePackage: vi.fn()
    } as any;

    // Create the Analysis Service with mocks
    analysisService = new AnalysisService(buildRepository, toolboxService, openaiService);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it('should process refinement request and switch tools based on feedback', async () => {
    // Set up the test build ID
    const testBuildId = 'test-build-123';

    // Mock the OpenAI refinePackage response to switch to playwright
    openaiService.refinePackage = vi.fn().mockResolvedValue(playwrightPackage);

    // Create the refinement input
    const refinementInput: RefinementInput = {
      buildId: testBuildId,
      originalObjective: 'Extract product names and prices',
      previousPackage: cheerioPackage,
      sampleResults: sampleResults,
      userFeedback: 'The prices are not being extracted. The site might be using JavaScript to load prices.',
      toolHints: ['Try using Playwright']
    };

    // Call the refinement method
    const result = await analysisService.refineBuildConfiguration(refinementInput);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.package).toBeDefined();
    
    if (result.package) {
      // Tool should be switched from Cheerio to Playwright
      expect(result.package.scraper.tool_id).toBe('scraper:playwright_stealth_v1');
      
      // Verify the call to OpenAI service with correct parameters
      expect(openaiService.refinePackage).toHaveBeenCalledWith(
        'Extract product names and prices',
        cheerioPackage,
        sampleResults,
        'The prices are not being extracted. The site might be using JavaScript to load prices.',
        ['Try using Playwright']
      );
    }

    // Verify build repository update was called
    expect(buildRepository.updateBuildStatus).toHaveBeenCalledWith(
      testBuildId,
      BuildStatus.PROCESSING_FEEDBACK
      // The third parameter (error) is not passed
    );
  });

  it('should handle errors during refinement and update build status', async () => {
    // Set up the test build ID
    const testBuildId = 'test-build-123';
    
    // Mock OpenAI service to return null (failure)
    openaiService.refinePackage = vi.fn().mockResolvedValue(null);

    // Create the refinement input
    const refinementInput: RefinementInput = {
      buildId: testBuildId,
      originalObjective: 'Extract product data',
      previousPackage: cheerioPackage,
      sampleResults: sampleResults,
      userFeedback: 'Data is missing',
      toolHints: []
    };

    // Call the refinement method
    const result = await analysisService.refineBuildConfiguration(refinementInput);

    // Verify the result indicates failure
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.package).toBeUndefined();

    // Verify build repository was updated to FAILED status
    expect(buildRepository.updateBuildStatus).toHaveBeenCalledWith(
      testBuildId,
      BuildStatus.FAILED,
      expect.stringContaining('LLM refinement failed')
    );
  });

  it('should validate the refined package structure', async () => {
    // Set up the test build ID
    const testBuildId = 'test-build-123';

    // Mock an invalid package response
    const invalidPackage = {
      schemaVersion: '1.0',
      // Missing scraper field
      description: 'Invalid package'
    };
    
    openaiService.refinePackage = vi.fn().mockResolvedValue(invalidPackage);

    // Create the refinement input
    const refinementInput: RefinementInput = {
      buildId: testBuildId,
      originalObjective: 'Extract product data',
      previousPackage: cheerioPackage,
      sampleResults: sampleResults,
      userFeedback: 'Data is missing',
      toolHints: []
    };

    // Call the refinement method
    const result = await analysisService.refineBuildConfiguration(refinementInput);

    // Verify the result indicates validation failure
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid package structure');
    
    // Verify build repository was updated to FAILED status
    expect(buildRepository.updateBuildStatus).toHaveBeenCalledWith(
      testBuildId,
      BuildStatus.FAILED,
      expect.stringContaining('Invalid package structure')
    );
  });
});
