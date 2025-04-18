/**
 * Sample Feedback Controller
 *
 * Handles user feedback on sample scraping results
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { PrismaClient, BuildStatus } from '../../../generated/prisma/index.js';
import { BuildRepository } from '../../../infrastructure/db/build.repository.js';
import { ErrorReportingService } from '../../../core/services/error-reporting.service.js';
import { ErrorCategory, ErrorSeverity } from '../../../core/domain/error-reporting.types.js';
import { RefinementProcessor, FeedbackType } from '../../../jobs/processors/index.js';
import { 
  ScrapeJobIdParamsSchema,
  SampleResultsFeedbackSchema,
  ScrapeJobStatusSchema,
  ScrapeJobIdParams, 
  SampleResultsFeedback, 
  ScrapeJobStatus 
} from '../interactive-scrape.schema.js';

import type { FastifyRequest, FastifyReply } from '../../../types/fastify.js';

export interface SubmitSampleFeedbackRoute {
  Params: ScrapeJobIdParams;
  Body: SampleResultsFeedback;
  Reply: ScrapeJobStatus;
}

export class SampleFeedbackController {
  private fastify: any;

  constructor(
    private readonly buildRepository: BuildRepository,
    private readonly refinementProcessor: RefinementProcessor,
    private readonly errorReportingService: ErrorReportingService
  ) {}

  /**
   * Register the sample feedback route
   */
  registerRoutes(fastify: any) {
    this.fastify = fastify;
    this.fastify.post(
      '/scrapes/:job_id/sample-feedback',
      {
        schema: {
          params: ScrapeJobIdParamsSchema,
          body: SampleResultsFeedbackSchema,
          response: {
            200: ScrapeJobStatusSchema
          }
        }
      },
      this.handleSampleFeedback.bind(this)
    );
  }

  /**
   * Handle sample feedback request
   */
  async handleSampleFeedback(request: any, reply: FastifyReply) {
    const { params, body } = request as { params: ScrapeJobIdParams; body: SampleResultsFeedback };
    try {
      const { job_id } = params;
      const { approved, field_issues, custom_instructions } = body;
      
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
      
      // Ensure the build is in the correct state and has sample results
      if (build.status !== BuildStatus.PENDING_USER_FEEDBACK || !build.sampleResultsJson) {
        return reply.status(409).send({
          error: 'Invalid state transition',
          message: `Scrape job ${job_id} is not waiting for sample feedback`
        });
      }
      
      if (approved) {
        // If approved, proceed to confirmed state
        await this.buildRepository.updateBuildStatus(job_id, BuildStatus.CONFIRMED);
        
        // We don't start the full scrape automatically - this will be initiated via the runs endpoint
      } else {
        // Not approved, process feedback
        // First update userFeedbackJson
        const existingFeedback = build.userFeedbackJson 
          ? JSON.parse(build.userFeedbackJson as string) 
          : {};
        
        const userFeedback = {
          ...existingFeedback,
          timestamp: new Date().toISOString(),
          feedback_type: 'sample_feedback',
          approved,
          field_issues,
          custom_instructions
        };
        
        await this.buildRepository.updateUserFeedback(job_id, JSON.stringify(userFeedback));

        
        // Update status to indicate feedback processing
        await this.buildRepository.updateBuildStatus(job_id, BuildStatus.PROCESSING_FEEDBACK);
        
        // Process the refinement job
        this.refinementProcessor.process(job_id, userFeedback, FeedbackType.SAMPLE_FEEDBACK)
          .catch(error => {
            console.error(`[SampleFeedbackController] Error processing refinement for build ${job_id}:`, error);
            
            // Create detailed error information
            const errorDetails = errorReportingService.createErrorDetails(
              error,
              ErrorCategory.REFINEMENT,
              ErrorSeverity.ERROR,
              {
                buildId: job_id,
                operation: 'processSampleFeedback',
                feedback: JSON.stringify(userFeedback)
              }
            );
            
            // Update build with error details
            this.buildRepository.updateBuildError(job_id, errorDetails)
              .catch(err => {
                console.error(`[SampleFeedbackController] Error updating build error for ${job_id}:`, err);
              });
              
            // Update build status to FAILED
            this.buildRepository.updateBuildStatus(job_id, BuildStatus.FAILED)
              .catch(err => {
                console.error(`[SampleFeedbackController] Error updating build status for ${job_id}:`, err);
              });
          });
      }
      
      // Return immediate response
      return reply.send({
        job_id: job_id,
        status: approved ? 'ready_for_execution' : 'refining_approach',
        created_at: build.createdAt.toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error: any) {
      request.log.error({ error }, '[SampleFeedbackController] Error processing sample feedback');
      
      return reply.status(500).send({
        error: 'Failed to process sample feedback',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
}
