/**
 * Results Controller
 *
 * Handles retrieving results from completed scrape jobs
 */

import { Type } from '@sinclair/typebox';
import { BuildStatus } from '../../../generated/prisma/index.js';
import { BuildRepository } from '../../../infrastructure/db/build.repository.js';
import { PrismaClient } from '../../../generated/prisma/index.js';
import { 
  ScrapeJobIdParamsSchema,
  ScrapeResultsSchema,
  ScrapeJobIdParams, 
  ScrapeResults 
} from '../interactive-scrape.schema.js';

import type { FastifyRequest, FastifyReply } from '../../../types/fastify.js';

export interface GetScrapeResultsRoute {
  Params: ScrapeJobIdParams;
  Reply: ScrapeResults;
}

export class ResultsController {
  constructor(
    private readonly buildRepository: BuildRepository,
    private readonly prisma: PrismaClient
  ) {}

  /**
   * Register the get results route
   */
  registerRoutes(fastify: any) {
    fastify.get<GetScrapeResultsRoute>(
      '/scrapes/:job_id/results',
      {
        schema: {
          params: ScrapeJobIdParamsSchema,
          response: {
            200: ScrapeResultsSchema
          }
        }
      },
      this.handleGetResults.bind(this)
    );
  }

  /**
   * Handle get results request
   */
  async handleGetResults(request: any, reply: FastifyReply) {
    const { params } = request as { params: ScrapeJobIdParams };
    try {
      const { job_id } = params;
      
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
      
      // Ensure the build is completed
      if (build.status !== BuildStatus.COMPLETED && build.status !== BuildStatus.PARTIAL_SUCCESS) {
        return reply.status(409).send({
          job_id: job_id,
          status: 'PROCESSING',
          total_results: 0,
          results: [],
          execution_time_ms: 0
        });
      }
      
      // Get the runs associated with this build
      const runs = await this.prisma.run.findMany({
        where: { buildId: job_id }
      });
      
      // Collect results from all runs
      const allResults = [];
      let totalExecutionTime = 0;
      
      for (const run of runs) {
        if (run.resultJson) {
          const resultsObject = JSON.parse(run.resultJson as string);
          allResults.push(...(Array.isArray(resultsObject) ? resultsObject : [resultsObject]));
          if (resultsObject && resultsObject.execution_time_ms) {
            totalExecutionTime += resultsObject.execution_time_ms;
          }
        }
      }
      
      // Return the results
      return reply.send({
        job_id,
        status: build.status === BuildStatus.COMPLETED ? 'completed' : 'partial_success',
        total_results: allResults.length,
        results: allResults,
        execution_time_ms: totalExecutionTime
      });
    } catch (error: any) {
      request.log.error({ error }, '[ResultsController] Error getting scrape results');
      
      return reply.status(500).send({
        error: 'Failed to get scrape results',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
}
