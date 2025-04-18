/**
 * Tests for the StatusController
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StatusController } from '../../../../src/modules/scrapes/controllers/status.controller.js';
import { BuildRepository } from '../../../../src/infrastructure/db/build.repository.js';
import { BuildStatus } from '../../../../src/generated/prisma/index.js';
import { FullScrapeExecutionService } from '../../../../src/infrastructure/execution/full-scrape.service.js';

// Mock the Fastify instance and reply
const mockReply = {
  status: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis()
};

// Create mock request with job ID
const createRequest = (jobId = 'test-job-id') => ({
  params: { job_id: jobId },
  log: {
    error: vi.fn(),
    info: vi.fn()
  }
});

describe('StatusController', () => {
  let statusController: StatusController;
  let buildRepository: BuildRepository;
  let executionService: FullScrapeExecutionService;
  let fastifyMock: any;
  
  beforeEach(() => {
    // Create mocks
    buildRepository = {
      findBuildById: vi.fn().mockResolvedValue({
        id: 'test-job-id',
        status: BuildStatus.PENDING_ANALYSIS,
        userObjective: 'Extract product information',
        targetUrls: JSON.stringify(['https://example.com']),
        createdAt: new Date(),
        updatedAt: new Date(),
        initialPackageJson: JSON.stringify({
          schemaVersion: '1.0',
          description: 'Test Scraping Package',
          scraper: {
            tool_id: 'scraper:playwright_stealth_v1'
          }
        }),
        sampleResultsJson: null,
        finalPackageJson: null
      }),
      updateBuildStatus: vi.fn()
    } as unknown as BuildRepository;
    
    // Mock execution service
    executionService = {
      getProgress: vi.fn().mockResolvedValue({
        total_urls: 10,
        processed_urls: 5,
        percentage_complete: 50
      })
    } as unknown as FullScrapeExecutionService;
    
    // Create controller with mocks
    statusController = new StatusController(buildRepository, executionService);
    
    // Create fastify mock
    fastifyMock = {
      get: vi.fn((path, options, handler) => {
        return { path, options, handler };
      })
    };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should register the route', () => {
    statusController.registerRoutes(fastifyMock);
    expect(fastifyMock.get).toHaveBeenCalledWith(
      '/scrapes/:job_id',
      expect.any(Object),
      expect.any(Function)
    );
  });
  
  it('should return job status with proposal when available', async () => {
    // Set up the repository to return a build with proposal
    buildRepository.findBuildById = vi.fn().mockResolvedValue({
      id: 'test-job-id',
      status: BuildStatus.PENDING_USER_FEEDBACK,
      initialPackageJson: JSON.stringify({
        schemaVersion: '1.0',
        description: 'Test Scraping Package',
        scraper: {
          tool_id: 'scraper:playwright_stealth_v1',
          parameters: {
            selectors: {
              title: 'h1',
              price: '.price'
            }
          }
        }
      }),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    });
    
    const request = createRequest();
    await statusController.handleGetStatus(request, mockReply);
    
    // Verify response was sent with the proposal
    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      job_id: 'test-job-id',
      status: 'pending_user_feedback',
      proposal: expect.objectContaining({
        tool: 'scraper:playwright_stealth_v1'
      })
    }));
  });
  
  it('should return job status with progress for running jobs', async () => {
    // Set up the repository to return a running build
    buildRepository.findBuildById = vi.fn().mockResolvedValue({
      id: 'test-job-id',
      status: BuildStatus.EXECUTING_FULL_EXTRACTION,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    });
    
    const request = createRequest();
    await statusController.handleGetStatus(request, mockReply);
    
    // Verify progress was requested and included in response
    expect(executionService.getProgress).toHaveBeenCalledWith('test-job-id');
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      progress: {
        total_urls: 10,
        processed_urls: 5,
        percentage_complete: 50
      }
    }));
  });
  
  it('should return 404 for non-existent job', async () => {
    // Mock repository to return null (job not found)
    buildRepository.findBuildById = vi.fn().mockResolvedValue(null);
    
    const request = createRequest('non-existent-id');
    await statusController.handleGetStatus(request, mockReply);
    
    // Verify 404 response
    expect(mockReply.status).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      error: expect.stringContaining('not found')
    }));
  });
  
  it('should handle errors when fetching status', async () => {
    // Mock repository to throw an error
    buildRepository.findBuildById = vi.fn().mockRejectedValue(new Error('Database error'));
    
    const request = createRequest();
    await statusController.handleGetStatus(request, mockReply);
    
    // Verify error response
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error'
    }));
  });
});
