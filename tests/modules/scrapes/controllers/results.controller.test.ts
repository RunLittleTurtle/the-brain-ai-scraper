/**
 * Tests for the ResultsController
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResultsController } from '../../../../src/modules/scrapes/controllers/results.controller.js';
import { BuildRepository } from '../../../../src/infrastructure/db/build.repository.js';
import { BuildStatus } from '../../../../src/generated/prisma/index.js';
import { PrismaClient } from '../../../../src/generated/prisma/index.js';

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

describe('ResultsController', () => {
  let resultsController: ResultsController;
  let buildRepository: BuildRepository;
  let prismaClient: PrismaClient;
  let fastifyMock: any;
  
  beforeEach(() => {
    // Create mocks
    prismaClient = {
      result: {
        findMany: vi.fn().mockResolvedValue([
          { 
            id: 'result-1',
            buildId: 'test-job-id',
            url: 'https://example.com/product1',
            content: JSON.stringify({ title: 'Product 1', price: '99.99' }),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'result-2',
            buildId: 'test-job-id',
            url: 'https://example.com/product2',
            content: JSON.stringify({ title: 'Product 2', price: '149.99' }),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]),
        count: vi.fn().mockResolvedValue(2)
      }
    } as unknown as PrismaClient;
    
    buildRepository = {
      findBuildById: vi.fn().mockResolvedValue({
        id: 'test-job-id',
        status: BuildStatus.COMPLETED,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T01:00:00Z')
      })
    } as unknown as BuildRepository;
    
    // Create controller with mocks
    resultsController = new ResultsController(buildRepository, prismaClient);
    
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
    resultsController.registerRoutes(fastifyMock);
    expect(fastifyMock.get).toHaveBeenCalledWith(
      '/scrapes/:job_id/results',
      expect.any(Object),
      expect.any(Function)
    );
  });
  
  it('should return job results when available', async () => {
    const request = createRequest();
    await resultsController.handleGetResults(request, mockReply);
    
    // Verify prisma was queried for results
    expect(prismaClient.result.findMany).toHaveBeenCalledWith({
      where: { buildId: 'test-job-id' }
    });
    
    // Verify count was requested
    expect(prismaClient.result.count).toHaveBeenCalledWith({
      where: { buildId: 'test-job-id' }
    });
    
    // Verify response contains correctly formatted results
    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      job_id: 'test-job-id',
      status: 'completed',
      total_results: 2,
      results: expect.arrayContaining([
        expect.objectContaining({ title: 'Product 1' }),
        expect.objectContaining({ title: 'Product 2' })
      ]),
      execution_time_ms: 3600000 // 1 hour in milliseconds
    }));
  });
  
  it('should handle job with no results', async () => {
    // Mock no results
    prismaClient.result.findMany = vi.fn().mockResolvedValue([]);
    prismaClient.result.count = vi.fn().mockResolvedValue(0);
    
    const request = createRequest();
    await resultsController.handleGetResults(request, mockReply);
    
    // Verify response for empty results
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      total_results: 0,
      results: []
    }));
  });
  
  it('should return 404 for non-existent job', async () => {
    // Mock repository to return null (job not found)
    buildRepository.findBuildById = vi.fn().mockResolvedValue(null);
    
    const request = createRequest('non-existent-id');
    await resultsController.handleGetResults(request, mockReply);
    
    // Verify 404 response
    expect(mockReply.status).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      error: expect.stringContaining('not found')
    }));
  });
  
  it('should return 403 for job not yet completed', async () => {
    // Set up the repository to return a non-completed build
    buildRepository.findBuildById = vi.fn().mockResolvedValue({
      id: 'test-job-id',
      status: BuildStatus.EXECUTING_FULL_EXTRACTION
    });
    
    const request = createRequest();
    await resultsController.handleGetResults(request, mockReply);
    
    // Verify not ready response
    expect(mockReply.status).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      error: expect.stringContaining('not ready')
    }));
  });
  
  it('should handle database errors when fetching results', async () => {
    // Mock prisma to throw an error
    prismaClient.result.findMany = vi.fn().mockRejectedValue(new Error('Database error'));
    
    const request = createRequest();
    await resultsController.handleGetResults(request, mockReply);
    
    // Verify error response
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error'
    }));
  });
});
