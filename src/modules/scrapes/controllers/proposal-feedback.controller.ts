/**
 * Proposal Feedback Controller
 *
 * Handles user feedback on proposed scraping approaches
 */

import { Type } from '@sinclair/typebox';
import { BuildStatus } from '../../../generated/prisma/index.js';
import { BuildRepository } from '../../../infrastructure/db/build.repository.js';
import { errorReportingService } from '../../../core/services/error-reporting.service.js';
import { ErrorCategory, ErrorSeverity } from '../../../core/domain/error-reporting.types.js';
import { 
  RefinementProcessor, 
  SampleGenerationProcessor,
  FeedbackType 
} from '../../../jobs/processors/index.js';
import { 
  ScrapeJobIdParamsSchema,
  ScrapeProposalFeedbackSchema,
  ScrapeJobStatusSchema,
  ScrapeJobIdParams, 
  ScrapeProposalFeedback, 
  ScrapeJobStatus 
} from '../interactive-scrape.schema.js';

import type { FastifyRequest, FastifyReply } from '../../../types/fastify.js';

export interface SubmitProposalFeedbackRoute {
  Params: ScrapeJobIdParams;
  Body: ScrapeProposalFeedback;
  Reply: ScrapeJobStatus;
}

export class ProposalFeedbackController {
  constructor(
    private readonly buildRepository: BuildRepository,
    private readonly refinementProcessor: RefinementProcessor,
    private readonly sampleProcessor: SampleGenerationProcessor
  ) {}

  /**
   * Register the proposal feedback route
   */
  registerRoutes(fastify: any) {
    fastify.post<SubmitProposalFeedbackRoute>(
      '/scrapes/:job_id/proposal-feedback',
      {
        schema: {
          params: ScrapeJobIdParamsSchema,
          body: ScrapeProposalFeedbackSchema,
          response: {
            200: ScrapeJobStatusSchema
          }
        }
      },
      this.handleProposalFeedback.bind(this)
    );
  }

  /**
   * Handle proposal feedback request
   */
  async handleProposalFeedback(request: any, reply: FastifyReply) {
    const { params, body } = request as { params: ScrapeJobIdParams; body: ScrapeProposalFeedback };
    try {
      const { job_id } = params;
      const { approved, additional_fields, remove_fields, custom_instructions } = body;
      
      // Get the build from the repository
      const build = await this.buildRepository.findBuildById(job_id);
      
      if (!build) {
        return reply.status(404).send({
          job_id: job_id,
          status: 'ERROR',
          total_results: 0,
          results: [],
          execution_time_ms: 0
        });
      }
      
      // Ensure the build is in the correct state
      if (build.status !== BuildStatus.PENDING_USER_FEEDBACK || build.sampleResultsJson) {
        return reply.status(409).send({
          error: 'Invalid state transition',
          message: `Scrape job ${job_id} is not waiting for proposal feedback`
        });
      }
      
      if (approved) {
        // If approved, proceed to sample generation
        // First update userFeedbackJson
        const userFeedback = {
          timestamp: new Date().toISOString(),
          feedback_type: 'proposal_feedback',
          approved,
          additional_fields,
          remove_fields,
          custom_instructions
        };
        
        await this.buildRepository.updateUserFeedback(job_id, JSON.stringify(userFeedback));
        
        // If there's feedback to incorporate, process it first
        if (additional_fields || remove_fields || custom_instructions) {
          // Update status to indicate feedback processing
          await this.buildRepository.updateBuildStatus(job_id, BuildStatus.PROCESSING_FEEDBACK);
          
          // Process the refinement job to incorporate feedback
          this.refinementProcessor.process(job_id, userFeedback, FeedbackType.PROPOSAL_FEEDBACK)
            .catch(error => {
              console.error(`[ProposalFeedbackController] Error processing refinement for build ${job_id}:`, error);
              
              // Create detailed error information
              const errorDetails = errorReportingService.createErrorDetails(
                error,
                ErrorCategory.REFINEMENT,
                ErrorSeverity.ERROR,
                {
                  buildId: job_id,
                  operation: 'processFeedback',
                  feedback: JSON.stringify(userFeedback)
                }
              );
              
              // Update build with error details
              this.buildRepository.updateBuildError(job_id, errorDetails)
                .catch(err => {
                  console.error(`[ProposalFeedbackController] Error updating build error for ${job_id}:`, err);
                });
                
              // Update build status to FAILED
              this.buildRepository.updateBuildStatus(job_id, BuildStatus.FAILED)
                .catch(err => {
                  console.error(`[ProposalFeedbackController] Error updating build status for ${job_id}:`, err);
                });
            });
        } else {
          // No refinement needed, generate samples directly
          await this.buildRepository.updateBuildStatus(job_id, BuildStatus.GENERATING_SAMPLES);
          
          // Process the sample generation
          this.sampleProcessor.process(job_id)
            .catch(error => {
              console.error(`[ProposalFeedbackController] Error generating samples for build ${job_id}:`, error);
              
              // Create detailed error information
              const errorDetails = errorReportingService.createErrorDetails(
                error,
                ErrorCategory.SAMPLE_GENERATION,
                ErrorSeverity.ERROR,
                {
                  buildId: job_id,
                  operation: 'generateSamples'
                }
              );
              
              // Update build with error details
              this.buildRepository.updateBuildError(job_id, errorDetails)
                .catch(err => {
                  console.error(`[ProposalFeedbackController] Error updating build error for ${job_id}:`, err);
                });
                
              // Update build status to FAILED
              this.buildRepository.updateBuildStatus(job_id, BuildStatus.FAILED)
                .catch(err => {
                  console.error(`[ProposalFeedbackController] Error updating build status for ${job_id}:`, err);
                });
            });
        }
        
        // Return immediate response indicating processing has started
        return reply.send({
          job_id: job_id,
          status: additional_fields || remove_fields || custom_instructions 
            ? 'refining_approach' 
            : 'generating_proposal',
          created_at: build.createdAt.toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        // If not approved, cancel the job
        await this.buildRepository.updateBuildStatus(job_id, BuildStatus.CANCELLED);
        
        // Return cancelled status
        return reply.send({
          job_id: job_id,
          status: 'cancelled',
          created_at: build.createdAt.toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error: any) {
      request.log.error({ error }, '[ProposalFeedbackController] Error processing proposal feedback');
      
      return reply.status(500).send({
        error: 'Failed to process proposal feedback',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
}
