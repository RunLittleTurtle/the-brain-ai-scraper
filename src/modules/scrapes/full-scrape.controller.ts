/**
 * Full Scrape Controller
 * 
 * Provides API endpoints for managing full scrape executions
 */

import { FastifyPluginAsync } from 'fastify';
import { FastifyInstance, FastifyRequest, FastifyReply } from '../../types/fastify.js';
import { Type } from '@sinclair/typebox';
import { BuildStatus } from '../../generated/prisma/index.js';
import { FullScrapeExecutionService } from '../../infrastructure/execution/full-scrape.service.js';
import { errorReportingService } from '../../core/services/error-reporting.service.js';
import { ErrorCategory } from '../../core/domain/error-reporting.types.js';
import { UniversalConfigurationPackageFormatV1 } from '../../core/domain/configuration-package.types.js';

// Define request/response schemas
const startScrapeParamsSchema = Type.Object({
  build_id: Type.String({ minLength: 5 })
});

const startScrapeBodySchema = Type.Object({
  timeout_ms: Type.Optional(Type.Number({ minimum: 5000, maximum: 24 * 60 * 60 * 1000 })),
  batch_size: Type.Optional(Type.Number({ minimum: 1, maximum: 100 }))
});

const scrapeStatusParamsSchema = Type.Object({
  build_id: Type.String({ minLength: 5 })
});

const scrapeStatusResponseSchema = Type.Object({
  build_id: Type.String(),
  status: Type.String(),
  progress: Type.Object({
    totalUrls: Type.Number(),
    processedUrls: Type.Number(),
    successfulUrls: Type.Number(),
    failedUrls: Type.Number(),
    percentComplete: Type.Number()
  }),
  start_time: Type.String(),
  end_time: Type.Optional(Type.String()),
  elapsed_time_ms: Type.Number(),
  error: Type.Optional(Type.String())
});

const cancelScrapeParamsSchema = Type.Object({
  build_id: Type.String({ minLength: 5 })
});

// Controller that handles all full scrape related routes
const fullScrapeController: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Inject the FullScrapeExecutionService - gets initialized in dependencies plugin
  const fullScrapeService = fastify.fullScrapeService;

  // Register routes
  
  /**
   * Start a full scrape for a build
   */
  fastify.post<{ Params: { build_id: string }, Body: { timeout_ms?: number, batch_size?: number } }>(
    '/:build_id/start',
    {
      schema: {
        params: startScrapeParamsSchema,
        body: startScrapeBodySchema,
        response: {
          202: Type.Object({
            message: Type.String(),
            build_id: Type.String(),
            status: Type.String()
          }),
          400: Type.Object({
            message: Type.String(),
            statusCode: Type.Number({ default: 400 })
          }),
          404: Type.Object({
            message: Type.String(),
            statusCode: Type.Number({ default: 404 })
          }),
          409: Type.Object({
            message: Type.String(),
            statusCode: Type.Number({ default: 409 }),
            currentStatus: Type.String()
          }),
          500: Type.Object({
            message: Type.String(),
            statusCode: Type.Number({ default: 500 })
          })
        }
      }
    },
    async (request, reply) => {
      const { build_id } = request.params;
      const { timeout_ms, batch_size } = request.body;
      
      try {
        // Get the build from the repository
        const build = await fastify.prisma.build.findUnique({
          where: { id: build_id }
        });
        
        if (!build) {
          return reply.notFound(`Build with ID '${build_id}' not found`);
        }
        
        // Check if the build is in a state where it can be executed
        const validStartStates = [
          BuildStatus.PENDING_USER_FEEDBACK, 
          BuildStatus.READY_FOR_SCRAPING
        ];
        
        if (!validStartStates.includes(build.status)) {
          return reply.code(409).send({
            message: `Build is in status '${build.status}' and cannot be executed`,
            statusCode: 409,
            currentStatus: build.status
          });
        }
        
        // Check if the build has a valid configuration package
        if (!build.finalPackageJson) {
          return reply.badRequest('Build does not have a valid configuration package');
        }
        
        // Parse the configuration package
        const configPackage = build.finalPackageJson as unknown as UniversalConfigurationPackageFormatV1;
        
        // Start the full scrape
        const options = {
          timeoutMs: timeout_ms,
          batchSize: batch_size
        };
        
        const executionState = await fullScrapeService.startFullScrape(build_id, configPackage, options);
        
        // Return success response
        return reply.status(202).send({
          message: 'Full scrape started successfully',
          build_id: build_id,
          status: executionState.status
        });
      } catch (error: any) {
        fastify.log.error(`Error starting full scrape for build ${build_id}:`, error);
        
        // Create error details
        const errorDetails = errorReportingService.createErrorDetails(
          error,
          ErrorCategory.SCRAPING,
          undefined,
          {
            buildId: build_id,
            operation: 'startFullScrape',
            requestBody: request.body
          }
        );
        
        // Update build error if possible
        try {
          // Get the build repository from fastify
          const buildRepository = fastify.buildRepository;
          await buildRepository.updateBuildError(build_id, errorDetails);
        } catch (repoError) {
          fastify.log.error(`Error updating build error for ${build_id}:`, repoError);
        }
        
        return reply.internalServerError(`Failed to start full scrape: ${error.message}`);
      }
    }
  );
  
  /**
   * Get the status of a full scrape
   */
  fastify.get<{ Params: { build_id: string } }>(
    '/:build_id/status',
    {
      schema: {
        params: scrapeStatusParamsSchema,
        response: {
          200: scrapeStatusResponseSchema,
          404: Type.Object({
            message: Type.String(),
            statusCode: Type.Number({ default: 404 })
          }),
          500: Type.Object({
            message: Type.String(),
            statusCode: Type.Number({ default: 500 })
          })
        }
      }
    },
    async (request, reply) => {
      const { build_id } = request.params;
      
      try {
        // Get the execution state
        const executionState = fullScrapeService.getExecutionState(build_id);
        
        if (!executionState) {
          // Try to get status from the database
          const build = await fastify.prisma.build.findUnique({
            where: { id: build_id }
          });
          
          if (!build) {
            return reply.notFound(`Build with ID '${build_id}' not found`);
          }
          
          // Check if the build has metadata with scrape progress
          const scrapeProgress = build.metadata?.scrapeProgress;
          
          if (!scrapeProgress) {
            // No active execution and no historical data
            return reply.notFound(`No scrape execution found for build ${build_id}`);
          }
          
          // Return historical data
          const status = {
            build_id,
            status: build.status,
            progress: {
              totalUrls: scrapeProgress.totalUrls || 0,
              processedUrls: scrapeProgress.processedUrls || 0,
              successfulUrls: scrapeProgress.successfulUrls || 0,
              failedUrls: scrapeProgress.failedUrls || 0,
              percentComplete: scrapeProgress.totalUrls ? 
                Math.round((scrapeProgress.processedUrls / scrapeProgress.totalUrls) * 100) : 0
            },
            start_time: scrapeProgress.startTime || build.createdAt.toISOString(),
            end_time: scrapeProgress.endTime || build.updatedAt.toISOString(),
            elapsed_time_ms: 0, // Can't calculate without proper timestamps
            error: build.error || null
          };
          
          return reply.send(status);
        }
        
        // Calculate elapsed time
        const now = new Date();
        const endTime = executionState.endTime || now;
        const elapsedTimeMs = endTime.getTime() - executionState.startTime.getTime();
        
        // Calculate percentage complete
        const percentComplete = executionState.progress.totalUrls ? 
          Math.round((executionState.progress.processedUrls / executionState.progress.totalUrls) * 100) : 0;
        
        // Return the status
        return reply.send({
          build_id: executionState.buildId,
          status: executionState.status,
          progress: {
            ...executionState.progress,
            percentComplete
          },
          start_time: executionState.startTime.toISOString(),
          end_time: executionState.endTime?.toISOString(),
          elapsed_time_ms: elapsedTimeMs,
          error: executionState.error
        });
      } catch (error: any) {
        fastify.log.error(`Error getting scrape status for build ${build_id}:`, error);
        return reply.internalServerError(`Failed to get scrape status: ${error.message}`);
      }
    }
  );
  
  /**
   * Cancel a running scrape
   */
  fastify.post<{ Params: { build_id: string } }>(
    '/:build_id/cancel',
    {
      schema: {
        params: cancelScrapeParamsSchema,
        response: {
          200: Type.Object({
            message: Type.String(),
            build_id: Type.String(),
            cancelled: Type.Boolean()
          }),
          404: Type.Object({
            message: Type.String(),
            statusCode: Type.Number({ default: 404 })
          }),
          500: Type.Object({
            message: Type.String(),
            statusCode: Type.Number({ default: 500 })
          })
        }
      }
    },
    async (request, reply) => {
      const { build_id } = request.params;
      
      try {
        // Attempt to cancel the execution
        const cancelled = await fullScrapeService.cancelExecution(build_id);
        
        if (!cancelled) {
          return reply.notFound(`No active scrape execution found for build ${build_id}`);
        }
        
        // Return success response
        return reply.send({
          message: 'Scrape execution cancelled successfully',
          build_id,
          cancelled: true
        });
      } catch (error: any) {
        fastify.log.error(`Error cancelling scrape for build ${build_id}:`, error);
        return reply.internalServerError(`Failed to cancel scrape execution: ${error.message}`);
      }
    }
  );
};

export default fullScrapeController;
