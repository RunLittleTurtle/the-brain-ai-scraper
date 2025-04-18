/**
 * Tests for the ProposalFeedbackController
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProposalFeedbackController } from '../../../../src/modules/scrapes/controllers/proposal-feedback.controller.js';
import { BuildRepository } from '../../../../src/infrastructure/db/build.repository.js';
import { BuildStatus } from '../../../../src/generated/prisma/index.js';
import { RefinementProcessor, SampleGenerationProcessor } from '../../../../src/jobs/processors/index.js';
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

describe('ProposalFeedbackController', () => {
  let proposalFeedbackController: ProposalFeedbackController;
  let buildRepository: BuildRepository;
  let refinementProcessor: RefinementProcessor;
  let sampleProcessor: SampleGenerationProcessor;
  let fastifyMock: any;
  
  beforeEach(() => {
    // Create mocks
    buildRepository = {
      findBuildById: vi.fn().mockResolvedValue({
        id: 'test-job-id',
        status: BuildStatus.PENDING_USER_FEEDBACK,
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
    
    sampleProcessor = {
      process: vi.fn().mockResolvedValue(undefined)
    } as unknown as SampleGenerationProcessor;
    
    // Create controller with mocks
    proposalFeedbackController = new ProposalFeedbackController(
      buildRepository,
      refinementProcessor,
      sampleProcessor
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
    proposalFeedbackController.registerRoutes(fastifyMock);
    expect(fastifyMock.post).toHaveBeenCalledWith(
      '/scrapes/:job_id/proposal-feedback',
      expect.any(Object),
      expect.any(Function)
    );
  });
  
  it('should handle approval without modifications', async () => {
    const request = createRequest('test-job-id', { approved: true });
    
    await proposalFeedbackController.handleProposalFeedback(request, mockReply);
    
    // Verify user feedback was updated
    expect(buildRepository.updateUserFeedback).toHaveBeenCalledWith(
      'test-job-id',
      expect.stringContaining('"approved":true')
    );
    
    // Verify status was updated to sample generation
    expect(buildRepository.updateBuildStatus).toHaveBeenCalledWith(
      'test-job-id',
      BuildStatus.GENERATING_SAMPLES
    );
    
    // Verify sample processor was called
    expect(sampleProcessor.process).toHaveBeenCalledWith('test-job-id');
    
    // Verify response
    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      job_id: 'test-job-id',
      status: 'generating_samples'
    }));
  });
  
  it('should handle rejection with refinement', async () => {
    const feedback = {
      approved: false,
      additional_fields: ['author', 'category'],
      remove_fields: ['price'],
      custom_instructions: 'Please focus on product descriptions'
    };
    
    const request = createRequest('test-job-id', feedback);
    
    await proposalFeedbackController.handleProposalFeedback(request, mockReply);
    
    // Verify user feedback was updated with all feedback elements
    expect(buildRepository.updateUserFeedback).toHaveBeenCalledWith(
      'test-job-id',
      expect.stringContaining('"approved":false')
    );
    expect(buildRepository.updateUserFeedback).toHaveBeenCalledWith(
      'test-job-id',
      expect.stringContaining('additional_fields')
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
      FeedbackType.PROPOSAL_FEEDBACK
    );
  });
  
  it('should return 404 for non-existent job', async () => {
    // Mock repository to return null (job not found)
    buildRepository.findBuildById = vi.fn().mockResolvedValue(null);
    
    const request = createRequest('non-existent-id');
    await proposalFeedbackController.handleProposalFeedback(request, mockReply);
    
    // Verify 404 response
    expect(mockReply.status).toHaveBeenCalledWith(404);
  });
  
  it('should handle invalid state transition', async () => {
    // Set up the repository to return a build in the wrong state
    buildRepository.findBuildById = vi.fn().mockResolvedValue({
      id: 'test-job-id',
      status: BuildStatus.GENERATING_SAMPLES, // Not waiting for feedback
    });
    
    const request = createRequest();
    await proposalFeedbackController.handleProposalFeedback(request, mockReply);
    
    // Verify invalid state response
    expect(mockReply.status).toHaveBeenCalledWith(409);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid state transition'
    }));
  });
  
  it('should handle errors during feedback processing', async () => {
    const errorMessage = 'Failed to process feedback';
    refinementProcessor.process = vi.fn().mockRejectedValue(new Error(errorMessage));
    
    const request = createRequest('test-job-id', { approved: false });
    await proposalFeedbackController.handleProposalFeedback(request, mockReply);
    
    // Verify error response
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error'
    }));
  });
});
