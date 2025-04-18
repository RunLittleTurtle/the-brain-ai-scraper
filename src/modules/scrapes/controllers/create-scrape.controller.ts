/**
 * Create Scrape Controller
 *
 * Handles the creation of new interactive scrape jobs
 */

import { Type } from '@sinclair/typebox';
import { BuildStatus } from '../../../generated/prisma/index.js';
import { BuildRepository } from '../../../infrastructure/db/build.repository.js';
import { errorReportingService } from '../../../core/services/error-reporting.service.js';
import { ErrorCategory, ErrorSeverity } from '../../../core/domain/error-reporting.types.js';
import { BuildAnalysisProcessor } from '../../../jobs/processors/index.js';
import { InteractiveScrapeRequestSchema, InteractiveScrapeResponseSchema, InteractiveScrapeRequest, InteractiveScrapeResponse } from '../interactive-scrape.schema.js';

import type { FastifyRequest, FastifyReply } from '../../../types/fastify.js';

export interface CreateScrapeJobRoute {
  Body: InteractiveScrapeRequest;
  Reply: InteractiveScrapeResponse;
}

export class CreateScrapeController {
  constructor(
    private readonly buildRepository: BuildRepository,
    private readonly analysisProcessor: BuildAnalysisProcessor
  ) {}

  /**
   * Register the create scrape job route
   */
  registerRoutes(fastify: any) {
    fastify.post<CreateScrapeJobRoute>(
      '/scrapes',
      {
        schema: {
          body: InteractiveScrapeRequestSchema,
          response: {
            202: InteractiveScrapeResponseSchema
          }
        }
      },
      this.handleCreateScrapeJob.bind(this)
    );
  }

  /**
   * Handle create scrape job request
   */
  async handleCreateScrapeJob(request: any, reply: FastifyReply) {
    const { body } = request as { body: InteractiveScrapeRequest };
    try {
      const { target_urls, user_objective, max_results, additional_context } = body;
      
      // Create a new build record
      const build = await this.buildRepository.createBuild({
        userId: request.user?.id || 'anonymous',
        targetUrls: JSON.stringify(target_urls),
        targetUrlsList: target_urls as string[],
        userObjective: user_objective,
        status: BuildStatus.PENDING_ANALYSIS,
        metadata: additional_context ? JSON.stringify(additional_context) : null
      });
      
      // Start async processing
      // 1. First trigger the analysis process
      this.analysisProcessor.process(build.id, user_objective, target_urls)
        .catch(error => {
          console.error(`[CreateScrapeController] Error processing analysis for build ${build.id}:`, error);
          
          // Create detailed error information
          const errorDetails = errorReportingService.createErrorDetails(
            error,
            ErrorCategory.ANALYSIS,
            ErrorSeverity.ERROR,
            {
              buildId: build.id,
              operation: 'initialAnalysis',
              userObjective: body.user_objective
            }
          );
          
          // Update build with error details
          this.buildRepository.updateBuildError(build.id, errorDetails)
            .catch(err => {
              console.error(`[CreateScrapeController] Error updating build error for ${build.id}:`, err);
            });
            
          // Update build status to FAILED
          this.buildRepository.updateBuildStatus(build.id, BuildStatus.ANALYSIS_FAILED)
            .catch(err => {
              console.error(`[CreateScrapeController] Error updating build status for ${build.id}:`, err);
            });
        });
      
      // Return the job details
      return reply.status(202).send({
        job_id: build.id,
        status: 'pending',
        message: 'Interactive scrape job created. System is analyzing your request and searching knowledge base for similar past requests.'
      });
    } catch (error: any) {
      request.log.error({ error }, '[CreateScrapeController] Error creating scrape job');
      
      return reply.status(500).send({
        error: 'Failed to create scrape job',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
}
