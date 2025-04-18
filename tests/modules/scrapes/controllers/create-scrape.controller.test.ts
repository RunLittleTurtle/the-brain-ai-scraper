/**
 * Tests for the CreateScrapeController
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreateScrapeController } from '../../../../src/modules/scrapes/controllers/create-scrape.controller.js';
import { BuildRepository } from '../../../../src/infrastructure/db/build.repository.js';
import { BuildStatus } from '../../../../src/generated/prisma/index.js';
import { BuildAnalysisProcessor } from '../../../../src/jobs/processors/index.js';
import { createMockPrismaClient } from '../../../utils/test-db-helper.js';

// Mock the Fastify instance and reply
const mockReply = {
  status: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis()
};

// Mock request with required properties
const createValidRequest = (data = {}) => ({
  body: {
    target_urls: ['https://example.com'],
    user_objective: 'Extract product information',
    ...data
  },
  user: { id: 'test-user-id' }
});

describe('CreateScrapeController', () => {
  let createScrapeController: CreateScrapeController;
  let buildRepository: BuildRepository;
  let analysisProcessor: BuildAnalysisProcessor;
  let fastifyMock: any;
  
  beforeEach(() => {
    // Create mocks
    const prismaMock = createMockPrismaClient();
    buildRepository = {
      createBuild: vi.fn().mockResolvedValue({
        id: 'test-build-id',
        status: BuildStatus.PENDING_ANALYSIS,
        userObjective: 'Extract product information',
        targetUrls: JSON.stringify(['https://example.com']),
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      findBuildById: vi.fn(),
      updateBuildStatus: vi.fn(),
      updateUserFeedback: vi.fn()
    } as unknown as BuildRepository;
    
    analysisProcessor = {
      process: vi.fn().mockResolvedValue(undefined)
    } as unknown as BuildAnalysisProcessor;
    
    // Create controller with mocks
    createScrapeController = new CreateScrapeController(buildRepository, analysisProcessor);
    
    // Create fastify mock
    fastifyMock = {
      post: vi.fn((path, options, handler) => {
        return { path, options, handler };
      })
    };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should register the route', () => {
    createScrapeController.registerRoutes(fastifyMock);
    expect(fastifyMock.post).toHaveBeenCalledWith(
      '/scrapes',
      expect.any(Object),
      expect.any(Function)
    );
  });
  
  it('should create a scrape job and return a valid response', async () => {
    const request = createValidRequest();
    
    await createScrapeController.handleCreateScrape(request, mockReply);
    
    // Verify repository was called
    expect(buildRepository.createBuild).toHaveBeenCalledWith({
      userId: 'test-user-id',
      targetUrls: ['https://example.com'],
      targetUrlsList: ['https://example.com'],
      userObjective: 'Extract product information',
      status: BuildStatus.PENDING_ANALYSIS,
      metadata: null
    });
    
    // Verify analysis processor was called
    expect(analysisProcessor.process).toHaveBeenCalledWith('test-build-id');
    
    // Verify response was sent
    expect(mockReply.status).toHaveBeenCalledWith(202);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      job_id: 'test-build-id',
      status: 'pending'
    }));
  });
  
  it('should handle additional context', async () => {
    const request = createValidRequest({
      additional_context: { source: 'test', priority: 'high' }
    });
    
    await createScrapeController.handleCreateScrape(request, mockReply);
    
    expect(buildRepository.createBuild).toHaveBeenCalledWith(expect.objectContaining({
      metadata: JSON.stringify({ source: 'test', priority: 'high' })
    }));
  });
  
  it('should handle error when creating a scrape job', async () => {
    const request = createValidRequest();
    const errorMessage = 'Failed to create build';
    
    // Mock repository to throw an error
    buildRepository.createBuild = vi.fn().mockRejectedValue(new Error(errorMessage));
    
    await createScrapeController.handleCreateScrape(request, mockReply);
    
    // Verify error response was sent
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      error: expect.stringContaining(errorMessage)
    }));
  });
});
