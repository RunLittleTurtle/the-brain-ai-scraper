/**
 * Status Controller
 *
 * Handles retrieving the status of interactive scrape jobs
 */

import { Type } from '@sinclair/typebox';
import { BuildStatus } from '../../../generated/prisma/index.js';
import { BuildRepository } from '../../../infrastructure/db/build.repository.js';
import { FullScrapeExecutionService } from '../../../infrastructure/execution/full-scrape.service.js';
import { ScrapeJobIdParamsSchema, ScrapeJobStatusSchema, ScrapeJobIdParams, ScrapeJobStatus } from '../interactive-scrape.schema.js';

import type { FastifyRequest, FastifyReply } from '../../../types/fastify.js';

export interface GetScrapeJobStatusRoute {
  Params: ScrapeJobIdParams;
  Reply: ScrapeJobStatus;
}

export class StatusController {
  constructor(
    private readonly buildRepository: BuildRepository,
    private readonly executionService: FullScrapeExecutionService
  ) {}

  /**
   * Register the get status route
   */
  registerRoutes(fastify: any) {
    fastify.get(
      '/scrapes/:job_id',
      {
        schema: {
          params: ScrapeJobIdParamsSchema,
          response: {
            200: ScrapeJobStatusSchema
          }
        }
      },
      this.handleGetStatus.bind(this)
    );
  }

  /**
   * Handle get status request
   */
  async handleGetStatus(request: any, reply: FastifyReply) {
    const { params } = request as { params: ScrapeJobIdParams };
    try {
      const { job_id } = params;
      
      // Get the build from the repository
      const build = await this.buildRepository.findBuildById(job_id);
      
      if (!build) {
        return reply.status(404).send({
          job_id: job_id,
          status: 'ERROR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message: 'Job not found',
          error: 'The requested scrape job could not be found'
        });
      }
      
      // Get execution state for progress if applicable
      const executionState = this.executionService.getExecutionState(job_id);
      
      // Map build status to interactive flow status
      let interactiveStatus: string;
      switch (build.status) {
        case BuildStatus.PENDING_ANALYSIS:
          interactiveStatus = 'searching_knowledge_base';
          break;
        case BuildStatus.GENERATING_SAMPLES:
          interactiveStatus = 'generating_proposal';
          break;
        case BuildStatus.PENDING_USER_FEEDBACK:
          interactiveStatus = executionState ? 'waiting_for_sample_feedback' : 'waiting_for_approval';
          break;
        case BuildStatus.PROCESSING_FEEDBACK:
          interactiveStatus = 'refining_approach';
          break;
        case BuildStatus.READY_FOR_SCRAPING:
        case BuildStatus.CONFIRMED:
          interactiveStatus = 'ready_for_execution';
          break;
        case BuildStatus.SCRAPING_IN_PROGRESS:
          interactiveStatus = 'executing_full_scrape';
          break;
        case BuildStatus.COMPLETED:
        case BuildStatus.PARTIAL_SUCCESS:
          interactiveStatus = 'completed';
          break;
        case BuildStatus.FAILED:
        case BuildStatus.ANALYSIS_FAILED:
          interactiveStatus = 'failed';
          break;
        case BuildStatus.CANCELLED:
          interactiveStatus = 'cancelled';
          break;
        default:
          interactiveStatus = 'pending';
      }
      
      // Build the response
      const response: ScrapeJobStatus = {
        job_id: build.id,
        status: interactiveStatus,
        created_at: build.createdAt.toISOString(),
        updated_at: build.updatedAt.toISOString()
      };
      
      // Add progress information if available
      if (executionState && executionState.progress) {
        response.progress = {
          total_urls: executionState.progress.totalUrls,
          processed_urls: executionState.progress.processedUrls,
          percentage_complete: executionState.progress.totalUrls > 0 
            ? Math.round((executionState.progress.processedUrls / executionState.progress.totalUrls) * 100) 
            : 0
        };
      }
      
      // Add proposal information if available
      if (build.initialPackageJson && interactiveStatus === 'waiting_for_approval') {
        const initialPackage = JSON.parse(build.initialPackageJson as string);
        response.proposal = {
          job_id: build.id,
          status: interactiveStatus,
          proposed_approach: {
            tool: initialPackage.scraper?.tool_id || 'unknown',
            output_schema: initialPackage.expectedOutputSchema?.properties || {},
            estimated_completion_time: '5-10 minutes',
            sample_size: 3
          }
        };
      }
      
      // Add sample results if available
      if (build.sampleResultsJson && interactiveStatus === 'waiting_for_sample_feedback') {
        response.sample_results = JSON.parse(build.sampleResultsJson as string);
      }
      
      // Add error information if available
      if (build.error || build.errorDetailsJson) {
        response.error = build.error || (build.errorDetailsJson 
          ? JSON.parse(build.errorDetailsJson as string).message 
          : 'An error occurred during processing');
      }
      
      return reply.send(response);
    } catch (error: any) {
      request.log.error({ error }, '[StatusController] Error getting scrape job status');
      
      return reply.status(500).send({
        job_id: params.job_id,
        status: 'ERROR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error: 'Failed to get scrape job status',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
}
