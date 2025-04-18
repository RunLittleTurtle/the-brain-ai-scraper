/**
 * Interactive Scrape Controller
 * 
 * Implements the complete user flow for interactive scraping:
 * 1. User submits request
 * 2. System searches knowledge base
 * 3. System proposes approach
 * 4. User reviews proposal
 * 5. System generates samples
 * 6. User reviews samples
 * 7. System refines (if needed)
 * 8. System performs full extraction
 */

import { Type } from '@sinclair/typebox';
import { PrismaClient, BuildStatus } from '../../generated/prisma/index.js';
import { BuildRepository } from '../../infrastructure/db/build.repository.js';
import { AnalysisService } from '../analysis/analysis.service.js';
import { FullScrapeExecutionService } from '../../infrastructure/execution/full-scrape.service.js';
import { KnowledgeBaseService } from '../../infrastructure/knowledge/knowledge-base.service.js';
import { errorReportingService } from '../../core/services/error-reporting.service.js';
import { ErrorCategory, ErrorSeverity } from '../../core/domain/error-reporting.types.js';

// Import new modular processors
import { 
  createProcessors,
  BuildAnalysisProcessor,
  SampleGenerationProcessor,
  RefinementProcessor,
  ExecutionProcessor,
  FeedbackType
} from '../../jobs/processors/index.js';

import {
  ScrapeJobIdParams,
  InteractiveScrapeRequest,
  InteractiveScrapeResponse,
  ScrapeProposalFeedback,
  SampleResultsFeedback,
  ScrapeProposal,
  ScrapeJobStatus,
  ScrapeResultsSchema
} from './interactive-scrape.schema.js';

import type {
  FastifyRequest,
  FastifyReply,
  FastifyInstance as CustomFastifyInstance,
} from '../../types/fastify.js';
import type { FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import type { FastifyInstance as BaseFastifyInstance } from 'fastify';

// --- Route Type Interfaces --- //

interface CreateScrapeJobRoute {
  Body: InteractiveScrapeRequest;
  Reply: InteractiveScrapeResponse;
}

interface GetScrapeJobStatusRoute {
  Params: ScrapeJobIdParams;
  Reply: ScrapeJobStatus;
}

interface SubmitProposalFeedbackRoute {
  Params: ScrapeJobIdParams;
  Body: ScrapeProposalFeedback;
  Reply: ScrapeJobStatus;
}

interface SubmitSampleFeedbackRoute {
  Params: ScrapeJobIdParams;
  Body: SampleResultsFeedback;
  Reply: ScrapeJobStatus;
}

interface GetScrapeResultsRoute {
  Params: ScrapeJobIdParams;
  Reply: typeof ScrapeResultsSchema;
}

// --- Controller Plugin --- //

const interactiveScrapeController: FastifyPluginAsync = async (
  fastify: BaseFastifyInstance,
  opts: FastifyPluginOptions
) => {
  // Cast to our custom FastifyInstance if needed to access mcpService
  const server = fastify as unknown as CustomFastifyInstance;
  
  // Initialize services
  const prisma = new PrismaClient();
  const buildRepository = new BuildRepository(prisma);
  const analysisService = new AnalysisService(server.mcpService, buildRepository);
  const executionService = new FullScrapeExecutionService(
    server.executionEngine,
    buildRepository,
    prisma
  );
  const knowledgeBaseService = new KnowledgeBaseService(prisma);
  
  // Initialize the new modular processors
  const processors = createProcessors(
    buildRepository,
    analysisService,
    server.executionEngine,
    prisma
  );
  
  // Extract individual processors for clarity
  const { 
    analysisProcessor, 
    sampleProcessor, 
    refinementProcessor, 
    executionProcessor 
  } = processors;

  // Register routes
  
  /**
   * Create a new interactive scrape job
   */
  fastify.post<CreateScrapeJobRoute>(
    '/scrapes',
    {
      schema: {
        body: Type.Object({
          target_urls: Type.Array(Type.String()),
          user_objective: Type.String({ description: 'What the user wants to extract' }),
          max_results: Type.Optional(Type.Number()),
          additional_context: Type.Optional(Type.Record(Type.String(), Type.Any()))
        }),
        response: {
          202: Type.Object({
            job_id: Type.String(),
            status: Type.String(),
            message: Type.String()
          })
        }
      }
    },
    async (request, reply) => {
      try {
        const { target_urls, user_objective, max_results, additional_context } = request.body;
        
        // Create a new build record
        const build = await buildRepository.createBuild({
          userId: request.user?.id || 'anonymous',
          targetUrls: JSON.stringify(target_urls),
          targetUrlsList: target_urls,
          userObjective: user_objective,
          status: BuildStatus.PENDING_ANALYSIS,
          metadata: additional_context ? JSON.stringify(additional_context) : null
        });
        
        // Start async processing
        // 1. First trigger the analysis process
        analysisProcessor.process(build.id, user_objective, target_urls)
          .catch(error => {
            console.error(`[InteractiveScrapeController] Error processing analysis for build ${build.id}:`, error);
            
            // Create detailed error information
            const errorDetails = errorReportingService.createErrorDetails(
              error,
              ErrorCategory.ANALYSIS,
              ErrorSeverity.ERROR,
              {
                buildId: build.id,
                operation: 'initialAnalysis',
                userObjective
              }
            );
            
            // Update build with error details
            buildRepository.updateBuildError(build.id, errorDetails)
              .catch(err => {
                console.error(`[InteractiveScrapeController] Error updating build error for ${build.id}:`, err);
              });
              
            // Update build status to FAILED
            buildRepository.updateBuildStatus(build.id, BuildStatus.ANALYSIS_FAILED)
              .catch(err => {
                console.error(`[InteractiveScrapeController] Error updating build status for ${build.id}:`, err);
              });
          });
        
        // Return the job details
        return reply.status(202).send({
          job_id: build.id,
          status: 'pending',
          message: 'Interactive scrape job created. System is analyzing your request and searching knowledge base for similar past requests.'
        });
      } catch (error: any) {
        request.log.error({ error }, '[InteractiveScrapeController] Error creating scrape job');
        
        return reply.status(500).send({
          error: 'Failed to create scrape job',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );
  
  /**
   * Get the status of an interactive scrape job
   */
  fastify.get<GetScrapeJobStatusRoute>(
    '/scrapes/:job_id',
    {
      schema: {
        params: Type.Ref(ScrapeJobIdParams),
        response: {
          200: Type.Ref(ScrapeJobStatus)
        }
      }
    },
    async (request, reply) => {
      try {
        const { job_id } = request.params;
        
        // Get the build from the repository
        const build = await buildRepository.findBuildById(job_id);
        
        if (!build) {
          return reply.status(404).send({
            error: 'Scrape job not found',
            message: `No scrape job found with ID ${job_id}`
          });
        }
        
        // Get execution state for progress if applicable
        const executionState = executionService.getExecutionState(job_id);
        
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
        request.log.error({ error }, '[InteractiveScrapeController] Error getting scrape job status');
        
        return reply.status(500).send({
          error: 'Failed to get scrape job status',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );
  
   * Submit feedback on a scrape proposal
   */
  fastify.post<SubmitProposalFeedbackRoute>(
    '/scrapes/:job_id/proposal-feedback',
    {
      schema: {
        params: Type.Ref(ScrapeJobIdParams),
        body: Type.Ref(ScrapeProposalFeedback),
        response: {
          200: Type.Ref(ScrapeJobStatus)
        }
      }
    },
    async (request, reply) => {
      try {
        const { job_id } = request.params;
        const { approved, additional_fields, remove_fields, custom_instructions } = request.body;
        
        // Get the build from the repository
        const build = await buildRepository.findBuildById(job_id);
        
        if (!build) {
          return reply.status(404).send({
            error: 'Scrape job not found',
            message: `No scrape job found with ID ${job_id}`
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
          
          await buildRepository.updateBuild(job_id, {
            userFeedbackJson: JSON.stringify(userFeedback)
          });
          
          // If there's feedback to incorporate, process it first
          if (additional_fields || remove_fields || custom_instructions) {
            // Update status to indicate feedback processing
            await buildRepository.updateBuildStatus(job_id, BuildStatus.PROCESSING_FEEDBACK);
            
            // Process the refinement job to incorporate feedback
            refinementProcessor.process(job_id, userFeedback, FeedbackType.PROPOSAL_FEEDBACK)
              .catch(error => {
                console.error(`[InteractiveScrapeController] Error processing refinement for build ${job_id}:`, error);
                
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
                buildRepository.updateBuildError(job_id, errorDetails)
                  .catch(err => {
                    console.error(`[InteractiveScrapeController] Error updating build error for ${job_id}:`, err);
                  });
                  
                // Update build status to FAILED
                buildRepository.updateBuildStatus(job_id, BuildStatus.FAILED)
                  .catch(err => {
                    console.error(`[InteractiveScrapeController] Error updating build status for ${job_id}:`, err);
                  });
              });
          } else {
            // No refinement needed, generate samples directly
            await buildRepository.updateBuildStatus(job_id, BuildStatus.GENERATING_SAMPLES);
            
            // Process the sample generation
            sampleProcessor.process(job_id)
              .catch(error => {
                console.error(`[InteractiveScrapeController] Error generating samples for build ${job_id}:`, error);
                
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
                buildRepository.updateBuildError(job_id, errorDetails)
                  .catch(err => {
                    console.error(`[InteractiveScrapeController] Error updating build error for ${job_id}:`, err);
                  });
                  
                // Update build status to FAILED
                buildRepository.updateBuildStatus(job_id, BuildStatus.FAILED)
                  .catch(err => {
                    console.error(`[InteractiveScrapeController] Error updating build status for ${job_id}:`, err);
                  });
              });
          }
        } else {
          // If not approved, mark as failed
          await buildRepository.updateBuildStatus(
            job_id, 
            BuildStatus.FAILED,
            'User rejected the proposed scraping approach'
          );
        }
        
        // Return the updated status
        const updatedBuild = await buildRepository.findBuildById(job_id);
        
        // Map build status to interactive flow status
        let interactiveStatus: string;
        switch (updatedBuild?.status) {
          case BuildStatus.GENERATING_SAMPLES:
            interactiveStatus = 'generating_samples';
            break;
          case BuildStatus.PROCESSING_FEEDBACK:
            interactiveStatus = 'refining_approach';
            break;
          case BuildStatus.FAILED:
            interactiveStatus = 'failed';
            break;
          default:
            interactiveStatus = 'pending';
        }
        
        return reply.send({
          job_id,
          status: interactiveStatus,
          created_at: updatedBuild?.createdAt.toISOString() || new Date().toISOString(),
          updated_at: updatedBuild?.updatedAt.toISOString() || new Date().toISOString(),
          message: approved 
            ? 'Proposal approved. Generating sample results...' 
            : 'Proposal rejected. Please create a new scrape job with modified requirements.'
        });
      } catch (error: any) {
        request.log.error({ error }, '[InteractiveScrapeController] Error submitting proposal feedback');
        
        return reply.status(500).send({
          error: 'Failed to process proposal feedback',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );
  
  /**
   * Submit feedback on sample results
   */
  fastify.post<SubmitSampleFeedbackRoute>(
    '/scrapes/:job_id/sample-feedback',
    {
      schema: {
        params: Type.Ref(ScrapeJobIdParams),
        body: Type.Ref(SampleResultsFeedback),
        response: {
          200: Type.Ref(ScrapeJobStatus)
        }
      }
    },
    async (request, reply) => {
      try {
        const { job_id } = request.params;
        const { approved, field_issues, custom_instructions } = request.body;
        
        // Get the build from the repository
        const build = await buildRepository.findBuildById(job_id);
        
        if (!build) {
          return reply.status(404).send({
            error: 'Scrape job not found',
            message: `No scrape job found with ID ${job_id}`
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
          await buildRepository.updateBuildStatus(job_id, BuildStatus.CONFIRMED);
          
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
          
          await buildRepository.updateBuild(job_id, {
            userFeedbackJson: JSON.stringify(userFeedback)
          });
          
          // Update status to indicate feedback processing
          await buildRepository.updateBuildStatus(job_id, BuildStatus.PROCESSING_FEEDBACK);
          
          // Process the refinement job
          refinementProcessor.process(job_id, userFeedback, FeedbackType.SAMPLE_FEEDBACK)
            .catch(error => {
              console.error(`[InteractiveScrapeController] Error processing refinement for build ${job_id}:`, error);
              
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
              buildRepository.updateBuildError(job_id, errorDetails)
                .catch(err => {
                  console.error(`[InteractiveScrapeController] Error updating build error for ${job_id}:`, err);
                });
                
              // Update build status to FAILED
              buildRepository.updateBuildStatus(job_id, BuildStatus.FAILED)
                .catch(err => {
                  console.error(`[InteractiveScrapeController] Error updating build status for ${job_id}:`, err);
                });
            });
        }
        
        // Return the updated status
        const updatedBuild = await buildRepository.findBuildById(job_id);
        
        // Map build status to interactive flow status
        let interactiveStatus: string;
        switch (updatedBuild?.status) {
          case BuildStatus.CONFIRMED:
            interactiveStatus = 'ready_for_execution';
            break;
          case BuildStatus.PROCESSING_FEEDBACK:
            interactiveStatus = 'refining_approach';
            break;
          default:
            interactiveStatus = 'pending';
        }
        
        return reply.send({
          job_id,
          status: interactiveStatus,
          created_at: updatedBuild?.createdAt.toISOString() || new Date().toISOString(),
          updated_at: updatedBuild?.updatedAt.toISOString() || new Date().toISOString(),
          message: approved 
            ? 'Sample results approved. Ready for full extraction.' 
            : 'Processing feedback and refining the extraction approach.'
        });
      } catch (error: any) {
        request.log.error({ error }, '[InteractiveScrapeController] Error submitting sample feedback');
        
        return reply.status(500).send({
          error: 'Failed to process sample feedback',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );
  
  /**
   * Execute full scrape for an approved job
   */
  fastify.post<GetScrapeJobStatusRoute>(
    '/scrapes/:job_id/execute',
    {
      schema: {
        params: Type.Ref(ScrapeJobIdParams),
        response: {
          202: Type.Ref(ScrapeJobStatus)
        }
      }
    },
    async (request, reply) => {
      try {
        const { job_id } = request.params;
        
        // Get the build from the repository
        const build = await buildRepository.findBuildById(job_id);
        
        if (!build) {
          return reply.status(404).send({
            error: 'Scrape job not found',
            message: `No scrape job found with ID ${job_id}`
          });
        }
        
        // Ensure the build is in the correct state
        if (build.status !== BuildStatus.CONFIRMED && build.status !== BuildStatus.READY_FOR_SCRAPING) {
          return reply.status(409).send({
            error: 'Invalid state transition',
            message: `Scrape job ${job_id} is not ready for execution`
          });
        }
        
        // Get the final configuration package
        const configPackage = build.finalPackageJson 
          ? JSON.parse(build.finalPackageJson as string)
          : null;
          
        if (!configPackage) {
          return reply.status(400).send({
            error: 'Invalid configuration',
            message: `Scrape job ${job_id} does not have a valid configuration package`
          });
        }
        
        // Start the full scrape execution
        await buildRepository.updateBuildStatus(job_id, BuildStatus.SCRAPING_IN_PROGRESS);
        
        // Get the target URLs
        const targetUrls = build.targetUrlsList || [];
        
        // Start the execution
        executionProcessor.process(job_id, configPackage)
          .catch(error => {
            console.error(`[InteractiveScrapeController] Error executing scrape for build ${job_id}:`, error);
            
            // Create detailed error information
            const errorDetails = errorReportingService.createErrorDetails(
              error,
              ErrorCategory.EXECUTION,
              ErrorSeverity.ERROR,
              {
                buildId: job_id,
                operation: 'fullScrape',
                targetUrls: targetUrls.length
              }
            );
            
            // Update build with error details
            buildRepository.updateBuildError(job_id, errorDetails)
              .catch(err => {
                console.error(`[InteractiveScrapeController] Error updating build error for ${job_id}:`, err);
              });
              
            // Update build status to FAILED
            buildRepository.updateBuildStatus(job_id, BuildStatus.FAILED)
              .catch(err => {
                console.error(`[InteractiveScrapeController] Error updating build status for ${job_id}:`, err);
              });
          });
        
        // Return the status
        return reply.status(202).send({
          job_id,
          status: 'executing_full_scrape',
          created_at: build.createdAt.toISOString(),
          updated_at: new Date().toISOString(),
          message: 'Full scrape execution started. Check status for progress updates.'
        });
      } catch (error: any) {
        request.log.error({ error }, '[InteractiveScrapeController] Error executing full scrape');
        
        return reply.status(500).send({
          error: 'Failed to start full scrape execution',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );
  
  /**
   * Get the results of a completed scrape job
   */
  fastify.get<GetScrapeResultsRoute>(
    '/scrapes/:job_id/results',
    {
      schema: {
        params: Type.Ref(ScrapeJobIdParams),
        response: {
          200: Type.Ref(ScrapeResultsSchema)
        }
      }
    },
    async (request, reply) => {
      try {
        const { job_id } = request.params;
        
        // Get the build from the repository
        const build = await buildRepository.findBuildById(job_id);
        
        if (!build) {
          return reply.status(404).send({
            error: 'Scrape job not found',
            message: `No scrape job found with ID ${job_id}`
          });
        }
        
        // Ensure the build is completed
        if (build.status !== BuildStatus.COMPLETED && build.status !== BuildStatus.PARTIAL_SUCCESS) {
          return reply.status(409).send({
            error: 'Results not available',
            message: `Scrape job ${job_id} is not completed yet`
          });
        }
        
        // Get the runs associated with this build
        const runs = await prisma.run.findMany({
          where: { buildId: job_id }
        });
        
        // Collect results from all runs
        const allResults = [];
        let totalExecutionTime = 0;
        
        for (const run of runs) {
          if (run.resultsJson) {
            const runResults = JSON.parse(run.resultsJson as string);
            
            if (runResults.results) {
              allResults.push(...runResults.results);
            }
            
            if (runResults.execution_time_ms) {
              totalExecutionTime += runResults.execution_time_ms;
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
        request.log.error({ error }, '[InteractiveScrapeController] Error getting scrape results');
        
        return reply.status(500).send({
          error: 'Failed to get scrape results',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );
  
  /**
   * Cancel an in-progress scrape job
   */
  fastify.post<GetScrapeJobStatusRoute>(
    '/scrapes/:job_id/cancel',
    {
      schema: {
        params: Type.Ref(ScrapeJobIdParams),
        response: {
          200: Type.Ref(ScrapeJobStatus)
        }
      }
    },
    async (request, reply) => {
      try {
        const { job_id } = request.params;
        
        // Get the build from the repository
        const build = await buildRepository.findBuildById(job_id);
        
        if (!build) {
          return reply.status(404).send({
            error: 'Scrape job not found',
            message: `No scrape job found with ID ${job_id}`
          });
        }
        
        // Check if the job is in a cancellable state
        const cancellableStates = [
          BuildStatus.PENDING_ANALYSIS,
          BuildStatus.GENERATING_SAMPLES,
          BuildStatus.PROCESSING_FEEDBACK,
          BuildStatus.SCRAPING_IN_PROGRESS
        ];
        
        if (!cancellableStates.includes(build.status)) {
          return reply.status(409).send({
            error: 'Invalid state transition',
            message: `Scrape job ${job_id} cannot be cancelled in its current state`
          });
        }
        
        // If it's in SCRAPING_IN_PROGRESS, cancel the execution
        if (build.status === BuildStatus.SCRAPING_IN_PROGRESS) {
          const cancelled = await executionService.cancelExecution(job_id);
          
          if (!cancelled) {
            return reply.status(400).send({
              error: 'Cancel failed',
              message: `Failed to cancel execution for job ${job_id}`
            });
          }
        }
        
        // Update the build status
        await buildRepository.updateBuildStatus(
          job_id, 
          BuildStatus.CANCELLED,
          'Cancelled by user request'
        );
        
        // Return the updated status
        return reply.send({
          job_id,
          status: 'cancelled',
          created_at: build.createdAt.toISOString(),
          updated_at: new Date().toISOString(),
          message: 'Scrape job cancelled successfully'
        });
      } catch (error: any) {
        request.log.error({ error }, '[InteractiveScrapeController] Error cancelling scrape job');
        
        return reply.status(500).send({
          error: 'Failed to cancel scrape job',
          message: error.message || 'An unexpected error occurred'
        });
      }
    }
  );
};

export default interactiveScrapeController;
