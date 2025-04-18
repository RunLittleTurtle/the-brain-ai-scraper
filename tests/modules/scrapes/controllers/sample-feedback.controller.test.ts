/**
 * Tests for the SampleFeedbackController
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SampleFeedbackController } from '../../../../src/modules/scrapes/controllers/sample-feedback.controller.js';
import { BuildRepository } from '../../../../src/infrastructure/db/build.repository.js';
import { BuildStatus } from '../../../../src/generated/prisma/index.js';
import { RefinementProcessor } from '../../../../src/jobs/processors/index.js';
import { FeedbackType } from '../../../../src/jobs/processors/index.js';

// Mock the Fastify instance and reply
const mockReply = {
  status: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis()
};

// Create mock request with job ID and feedback
const createRequest = (jobId = 'test-job-id', feedback = {}) => ({
  params: { job_id: jobId },
  body: {
    approved: true,
    ...feedback
  },
  log: {
    error: vi.fn(),
    info: vi.fn()
  }
});

describe('SampleFeedbackController', () => {
  let sampleFeedbackController: SampleFeedbackController;
  let buildRepository: BuildRepository;
  let refinementProcessor: RefinementProcessor;
  let fastifyMock: any;
  
  beforeEach(() => {
    // Create mocks
    buildRepository = {
      findBuildById: vi.fn().mockResolvedValue({
        id: 'test-job-id',
        status: BuildStatus.PENDING_USER_FEEDBACK,
        sampleResultsJson: JSON.stringify([
          { url: 'https://example.com', title: 'Example Product', price: '99.99' }
        ]),
        initialPackageJson: JSON.stringify({
          schemaVersion: '1.0',
          description: 'Test Scraping Package',
          scraper: {
            tool_id: 'scraper:playwright_stealth_v1'
          }
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      updateBuildStatus: vi.fn().mockResolvedValue({}),
      updateUserFeedback: vi.fn().mockResolvedValue({})
    } as unknown as BuildRepository;
    
    refinementProcessor = {
      process: vi.fn().mockResolvedValue(undefined)
    } as unknown as RefinementProcessor;
    
    // Create controller with mocks
    sampleFeedbackController = new SampleFeedbackController(
      buildRepository,
      refinementProcessor
    );
    
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
    sampleFeedbackController.registerRoutes(fastifyMock);
    expect(fastifyMock.post).toHaveBeenCalledWith(
      '/scrapes/:job_id/sample-feedback',
      expect.any(Object),
      expect.any(Function)
    );
  });
  
  it('should handle sample approval and move to full extraction', async () => {
    const request = createRequest('test-job-id', { 
      approved: true
    });
    
    await sampleFeedbackController.handleSampleFeedback(request, mockReply);
    
    // Verify user feedback was updated
    expect(buildRepository.updateUserFeedback).toHaveBeenCalledWith(
      'test-job-id',
      expect.stringContaining('"approved":true')
    );
    
    // Verify status was updated to executing full extraction
    expect(buildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-job-id',
      BuildStatus.CONFIRMED
    );
    
    // Verify response
    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      job_id: 'test-job-id',
      status: 'executing_full_extraction'
    }));
  });
  
  it('should handle sample rejection with refinement', async () => {
    const feedback = {
      approved: false,
      field_issues: {
        title: 'Extracted title is incomplete',
        price: 'Price format is incorrect'
      },
      missing_fields: ['description', 'rating'],
      custom_instructions: 'Please extract the full description'
    };
    
    const request = createRequest('test-job-id', feedback);
    
    await sampleFeedbackController.handleSampleFeedback(request, mockReply);
    
    // Verify user feedback was updated with all feedback elements
    expect(buildRepository.updateUserFeedback).toHaveBeenCalledWith(
      'test-job-id',
      expect.stringContaining('"approved":false')
    );
    
    // Verify status was updated to processing feedback
    expect(buildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-job-id',
      BuildStatus.PROCESSING_FEEDBACK
    );
    
    // Verify refinement processor was called with the right feedback type
    expect(refinementProcessor.process).toHaveBeenCalledWith(
      'test-job-id', 
      expect.any(Object),
      FeedbackType.SAMPLE_FEEDBACK
    );
    
    // Verify response
    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      job_id: 'test-job-id',
      status: 'processing_feedback'
    }));
  });
  
  it('should return 404 for non-existent job', async () => {
    // Mock repository to return null (job not found)
    buildRepository.findBuildById = vi.fn().mockResolvedValue(null);
    
    const request = createRequest('non-existent-id');
    await sampleFeedbackController.handleSampleFeedback(request, mockReply);
    
    // Verify 404 response
    expect(mockReply.status).toHaveBeenCalledWith(404);
  });
  
  it('should handle invalid state transition', async () => {
    // Set up the repository to return a build in the wrong state
    buildRepository.findBuildById = vi.fn().mockResolvedValue({
      id: 'test-job-id',
      status: BuildStatus.CONFIRMED, // Not waiting for sample feedback
    });
    
    const request = createRequest();
    await sampleFeedbackController.handleSampleFeedback(request, mockReply);
    
    // Verify invalid state response
    expect(mockReply.status).toHaveBeenCalledWith(409);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Invalid state transition')
    }));
  });
  
  it('should handle errors during feedback processing', async () => {
    const errorMessage = 'Failed to process sample feedback';
    refinementProcessor.process = vi.fn().mockRejectedValue(new Error(errorMessage));
    
    const request = createRequest('test-job-id', { approved: false });
    await sampleFeedbackController.handleSampleFeedback(request, mockReply);
    
    // Verify error response
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error'
    }));
  });
});
