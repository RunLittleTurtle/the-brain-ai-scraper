/**
 * Scrape Execution Service
 * 
 * Core service that orchestrates the full scrape execution process
 */

import { PrismaClient, BuildStatus } from '../../../generated/prisma/index.js';
import { ExecutionEngineService } from '../execution.service.js';
import { UniversalConfigurationPackageFormatV1 } from '../../../core/domain/configuration-package.types.js';
import { IBuildRepository } from '../../db/build.repository.js';
import { ErrorCategory, ErrorSeverity } from '../../../core/domain/error-reporting.types.js';
import { errorReportingService } from '../../../core/services/error-reporting.service.js';
import { ToolExecutionResult } from '../tool.interface.js';
import { 
  IScrapeExecutionService, 
  ScrapeExecutionOptions,
  ScrapeExecutionState,
  IScrapeStateManager,
  IRateLimiter,
  IRetryManager,
  IScrapeErrorHandler
} from './scrape-execution.interface.js';
import { ScrapeStateManager } from './scrape-state-manager.service.js';
import { RateLimiter } from './rate-limiter.service.js';
import { RetryManager } from './retry-manager.service.js';
import { ScrapeErrorHandler } from './scrape-error-handler.service.js';

// Default timeout for a full scrape (2 hours)
const DEFAULT_SCRAPE_TIMEOUT_MS = 2 * 60 * 60 * 1000;

// Default batch size for processing URLs
const DEFAULT_BATCH_SIZE = 20;

// Progress update interval in milliseconds (every 30 seconds)
const PROGRESS_UPDATE_INTERVAL_MS = 30 * 1000;

/**
 * Service for managing full website scrape executions
 */
export class ScrapeExecutionService implements IScrapeExecutionService {
  private executionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private progressIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  private stateManager: IScrapeStateManager;
  private rateLimiter: IRateLimiter;
  private retryManager: IRetryManager;
  private errorHandler: IScrapeErrorHandler;
  
  /**
   * Initialize the Scrape Execution Service
   */
  constructor(
    private executionEngine: ExecutionEngineService,
    private buildRepository: IBuildRepository,
    private prisma: PrismaClient
  ) {
    // Initialize supporting services
    this.stateManager = new ScrapeStateManager();
    this.rateLimiter = new RateLimiter();
    this.retryManager = new RetryManager();
    this.errorHandler = new ScrapeErrorHandler(buildRepository, errorReportingService);
  }
  
  /**
   * Start a full scrape execution for a build
   * 
   * @param buildId The ID of the build to execute
   * @param configPackage The configuration package to use for the scrape
   * @param options Optional configuration options
   */
  async startScrape(
    buildId: string,
    configPackage: UniversalConfigurationPackageFormatV1,
    options: ScrapeExecutionOptions = {}
  ): Promise<ScrapeExecutionState> {
    // Get the build from the repository
    const build = await this.buildRepository.findBuildById(buildId);
    
    if (!build) {
      throw new Error(`Build with ID ${buildId} not found`);
    }
    
    // Check if the build is already being executed
    const existingState = this.stateManager.getState(buildId);
    if (existingState) {
      return existingState;
    }
    
    // Parse target URLs from the build
    const targetUrls = build.targetUrlsList || [];
    
    if (targetUrls.length === 0) {
      throw new Error('No target URLs found for this build');
    }
    
    // Initialize the rate limiter with the provided rate limit
    if (options.rateLimitRps) {
      (this.rateLimiter as RateLimiter).setRateLimit(options.rateLimitRps);
    }
    
    // Create the execution state
    const executionState = this.stateManager.createExecutionState(
      buildId,
      targetUrls,
      options
    );
    
    // Update the build status
    await this.buildRepository.updateBuildStatus(buildId, BuildStatus.SCRAPING_IN_PROGRESS);
    
    // Set up a timeout to cancel the execution if it takes too long
    const timeoutMs = options.timeoutMs || DEFAULT_SCRAPE_TIMEOUT_MS;
    const timeout = setTimeout(() => {
      this.handleExecutionTimeout(buildId);
    }, timeoutMs);
    
    this.executionTimeouts.set(buildId, timeout);
    
    // Set up a progress update interval
    const progressInterval = setInterval(() => {
      this.updateExecutionProgress(buildId);
    }, PROGRESS_UPDATE_INTERVAL_MS);
    
    this.progressIntervals.set(buildId, progressInterval);
    
    // Start the execution asynchronously
    this.executeFullScrape(buildId, configPackage, targetUrls, options)
      .catch(error => {
        console.error(`[ScrapeService] Error during scrape execution for build ${buildId}:`, error);
        
        // Create detailed error information
        this.errorHandler.handleExecutionError(buildId, error)
          .then(errorDetails => {
            // Update build with error details
            this.buildRepository.updateBuildError(buildId, errorDetails)
              .catch(err => {
                console.error(`[ScrapeService] Error updating build error for ${buildId}:`, err);
              });
            
            // Update build status to FAILED
            this.buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED)
              .catch(err => {
                console.error(`[ScrapeService] Error updating build status for ${buildId}:`, err);
              });
          });
        
        // Update execution state
        this.stateManager.markFailed(buildId, error.message || 'Unknown error');
        
        // Clean up resources
        this.cleanupExecution(buildId);
      });
    
    return executionState;
  }
  
  /**
   * Get the current state of a scrape execution
   * 
   * @param buildId The ID of the build to check
   */
  getExecutionState(buildId: string): ScrapeExecutionState | null {
    return this.stateManager.getState(buildId);
  }
  
  /**
   * Cancel an active scrape execution
   * 
   * @param buildId The ID of the build to cancel
   */
  async cancelExecution(buildId: string): Promise<boolean> {
    const executionState = this.stateManager.getState(buildId);
    
    if (!executionState) {
      return false;
    }
    
    // Mark the execution as cancelled
    this.stateManager.markCancelled(buildId);
    
    // Update the build status
    await this.buildRepository.updateBuildStatus(buildId, BuildStatus.CANCELLED, 'Scrape execution cancelled by user');
    
    // Clean up resources
    this.cleanupExecution(buildId);
    
    return true;
  }
  
  /**
   * Pause an active scrape execution
   * 
   * @param buildId The ID of the build to pause
   */
  async pauseExecution(buildId: string): Promise<boolean> {
    const executionState = this.stateManager.getState(buildId);
    
    if (!executionState || executionState.status !== 'running') {
      return false;
    }
    
    // Mark the execution as paused
    this.stateManager.markPaused(buildId);
    
    return true;
  }
  
  /**
   * Resume a paused scrape execution
   * 
   * @param buildId The ID of the build to resume
   */
  async resumeExecution(buildId: string): Promise<boolean> {
    const executionState = this.stateManager.getState(buildId);
    
    if (!executionState || executionState.status !== 'paused') {
      return false;
    }
    
    // Mark the execution as resumed
    this.stateManager.markResumed(buildId);
    
    return true;
  }
  
  /**
   * Internal method to execute the full scrape with retry mechanisms and rate limiting
   */
  private async executeFullScrape(
    buildId: string,
    configPackage: UniversalConfigurationPackageFormatV1,
    targetUrls: string[],
    options: ScrapeExecutionOptions
  ): Promise<void> {
    try {
      // Get the execution state
      const executionState = this.stateManager.getState(buildId);
      if (!executionState) {
        throw new Error(`No execution state found for build ${buildId}`);
      }
      
      // Update the status to running
      this.stateManager.updateStatus(buildId, 'running');
      
      // Calculate batch size
      const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
      
      // Create batches of URLs
      const urlBatches: string[][] = [];
      for (let i = 0; i < targetUrls.length; i += batchSize) {
        urlBatches.push(targetUrls.slice(i, i + batchSize));
      }
      
      // Store all results
      const allResults: ToolExecutionResult[] = [];
      let overallSuccess = true;
      
      // Process each batch
      for (let batchIndex = 0; batchIndex < urlBatches.length; batchIndex++) {
        // Update current batch in progress
        this.stateManager.updateProgress(buildId, {
          currentBatch: batchIndex + 1
        });
        
        // Check if cancellation was requested
        const currentState = this.stateManager.getState(buildId);
        if (!currentState || currentState.cancelRequested) {
          console.log(`[ScrapeService] Cancellation requested for build ${buildId}, stopping execution`);
          break;
        }
        
        // Check if pause was requested
        if (currentState.pauseRequested) {
          console.log(`[ScrapeService] Pause requested for build ${buildId}, pausing execution`);
          this.stateManager.updateStatus(buildId, 'paused');
          
          // Wait until resumed or cancelled
          while (true) {
            const pausedState = this.stateManager.getState(buildId);
            if (!pausedState || pausedState.cancelRequested) {
              // If cancelled during pause, exit
              break;
            }
            
            if (!pausedState.pauseRequested) {
              // If resumed, exit waiting loop
              this.stateManager.updateStatus(buildId, 'running');
              console.log(`[ScrapeService] Resuming execution for build ${buildId}`);
              break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Check again if cancelled
          const afterPauseState = this.stateManager.getState(buildId);
          if (!afterPauseState || afterPauseState.cancelRequested) {
            break;
          }
        }
        
        const batch = urlBatches[batchIndex];
        
        try {
          console.log(`[ScrapeService] Processing batch ${batchIndex + 1}/${urlBatches.length} for build ${buildId}`);
          
          // Process URLs with rate limiting
          const batchResults: ToolExecutionResult[] = [];
          
          for (const url of batch) {
            // Check for cancellation during batch processing
            const state = this.stateManager.getState(buildId);
            if (!state || state.cancelRequested) {
              break;
            }
            
            // Execute with rate limiting
            const result = await this.rateLimiter.execute(async () => {
              try {
                const singleUrlResult = await this.executionEngine.executePackage(configPackage, [url]);
                return singleUrlResult.results[0] || {
                  success: false,
                  url,
                  error: 'No result returned from execution engine'
                };
              } catch (error) {
                console.error(`[ScrapeService] Error processing URL ${url}:`, error);
                return {
                  success: false,
                  url,
                  error: error instanceof Error ? error.message : String(error)
                } as ToolExecutionResult;
              }
            });
            
            // Handle retry for failed URL
            if (!result.success) {
              const retryInfo = this.retryManager.trackFailedUrl(url, result.error || 'Unknown error');
              
              if (retryInfo.canRetry) {
                console.log(`[ScrapeService] URL ${url} failed, will retry later (attempt ${retryInfo.attemptsMade})`);
              } else {
                console.log(`[ScrapeService] URL ${url} failed and exceeded retry attempts`);
              }
            }
            
            // Add result
            batchResults.push(result);
            
            // Update progress
            this.stateManager.updateProgress(buildId, {
              processedUrls: (state.progress.processedUrls || 0) + 1,
              successfulUrls: (state.progress.successfulUrls || 0) + (result.success ? 1 : 0),
              failedUrls: (state.progress.failedUrls || 0) + (result.success ? 0 : 1)
            });
          }
          
          // Add batch results to overall results
          allResults.push(...batchResults);
          
          // Check if any URLs in this batch failed
          const batchSuccessful = batchResults.every(r => r.success);
          if (!batchSuccessful) {
            overallSuccess = false;
          }
          
        } catch (error) {
          // Handle batch error
          console.error(`[ScrapeService] Error processing batch ${batchIndex + 1} for build ${buildId}:`, error);
          
          await this.errorHandler.handleBatchError(buildId, batchIndex, error, batch);
          
          // Add failed results for this batch
          batch.forEach(url => {
            allResults.push({
              success: false,
              url,
              error: `Batch processing error: ${error instanceof Error ? error.message : String(error)}`
            } as ToolExecutionResult);
          });
          
          // Update progress
          const state = this.stateManager.getState(buildId);
          if (state) {
            this.stateManager.updateProgress(buildId, {
              processedUrls: state.progress.processedUrls + batch.length,
              failedUrls: state.progress.failedUrls + batch.length
            });
          }
          
          overallSuccess = false;
        }
      }
      
      // Process retry attempts for failed URLs
      const retryStats = this.retryManager.getRetryStats();
      if (retryStats.pendingRetries > 0) {
        console.log(`[ScrapeService] Processing ${retryStats.pendingRetries} retry attempts for build ${buildId}`);
        
        // Update progress with retry count
        this.stateManager.updateProgress(buildId, {
          retriedUrls: retryStats.pendingRetries
        });
        
        // Get URLs due for retry
        const urlsToRetry = this.retryManager.getUrlsDueForRetry();
        
        // Process each retry
        for (const url of urlsToRetry) {
          // Check for cancellation
          const state = this.stateManager.getState(buildId);
          if (!state || state.cancelRequested) {
            break;
          }
          
          console.log(`[ScrapeService] Retrying URL ${url} for build ${buildId}`);
          
          try {
            // Execute retry with rate limiting
            const retryResult = await this.rateLimiter.execute(async () => {
              return this.executionEngine.executePackage(configPackage, [url]);
            });
            
            // Get the result
            const singleResult = retryResult.results[0];
            
            if (singleResult && singleResult.success) {
              // Track successful retry
              this.retryManager.trackSuccessfulRetry(url);
              
              // Replace the result in the allResults array
              const existingIndex = allResults.findIndex(r => r.url === url);
              if (existingIndex >= 0) {
                allResults[existingIndex] = singleResult;
              } else {
                allResults.push(singleResult);
              }
              
              // Update counters
              const state = this.stateManager.getState(buildId);
              if (state) {
                this.stateManager.updateProgress(buildId, {
                  successfulUrls: state.progress.successfulUrls + 1,
                  failedUrls: Math.max(0, state.progress.failedUrls - 1)
                });
              }
            }
          } catch (error) {
            console.error(`[ScrapeService] Retry failed for URL ${url}:`, error);
          }
        }
      }
      
      // Process the final execution results
      if (overallSuccess) {
        // Mark execution as completed
        this.stateManager.markCompleted(buildId, allResults);
        
        // Update build status
        await this.buildRepository.updateBuildStatus(buildId, BuildStatus.EXECUTED);
      } else {
        // Some URLs failed, but we have partial results
        this.stateManager.markFailed(
          buildId, 
          `Some URLs failed to scrape successfully (${this.retryManager.getRetryStats().maxRetriesExceeded} exceeded max retries)`,
          allResults
        );
        
        // Create warning about partial failure
        const errorDetails = await this.errorHandler.handleExecutionError(
          buildId,
          `Partial scrape failure: ${this.retryManager.getRetryStats().maxRetriesExceeded} URLs failed after max retries`,
          { 
            successfulUrls: allResults.filter(r => r.success).length,
            failedUrls: allResults.filter(r => !r.success).length
          }
        );
        
        // Update build with warning
        await this.buildRepository.updateBuildError(buildId, errorDetails);
        
        // Update build status to EXECUTED_WITH_ERRORS
        await this.buildRepository.updateBuildStatus(buildId, BuildStatus.EXECUTED_WITH_ERRORS);
      }
      
      // Clean up resources
      this.cleanupExecution(buildId);
      
    } catch (error) {
      console.error(`[ScrapeService] Error during full scrape for build ${buildId}:`, error);
      
      // Create detailed error information
      const errorDetails = await this.errorHandler.handleExecutionError(buildId, error);
      
      // Update build with error details
      await this.buildRepository.updateBuildError(buildId, errorDetails);
      
      // Update build status
      await this.buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED);
      
      // Update execution state
      this.stateManager.markFailed(buildId, error instanceof Error ? error.message : String(error));
      
      // Clean up resources
      this.cleanupExecution(buildId);
      
      // Re-throw the error
      throw error;
    }
  }
  
  /**
   * Handle a timeout during execution
   */
  private async handleExecutionTimeout(buildId: string): Promise<void> {
    const executionState = this.stateManager.getState(buildId);
    
    if (!executionState || executionState.status !== 'running') {
      return;
    }
    
    console.error(`[ScrapeService] Execution timed out for build ${buildId}`);
    
    // Create detailed error information
    const errorDetails = await this.errorHandler.handleTimeout(buildId, executionState);
    
    // Update build with error details
    await this.buildRepository.updateBuildError(buildId, errorDetails);
    
    // Update build status
    await this.buildRepository.updateBuildStatus(buildId, BuildStatus.FAILED, 'Scrape execution timed out');
    
    // Update execution state
    this.stateManager.updateStatus(buildId, 'timeout', 'Execution timed out');
    
    // Clean up resources
    this.cleanupExecution(buildId);
  }
  
  /**
   * Update the progress information for an execution
   */
  private async updateExecutionProgress(buildId: string): Promise<void> {
    const executionState = this.stateManager.getState(buildId);
    
    if (!executionState || executionState.status !== 'running') {
      return;
    }
    
    // Log progress
    console.log(`[ScrapeService] Progress for build ${buildId}: ${executionState.progress.processedUrls}/${executionState.progress.totalUrls} URLs processed`);
  }
  
  /**
   * Clean up resources for an execution
   */
  private cleanupExecution(buildId: string): void {
    // Clear the timeout
    const timeout = this.executionTimeouts.get(buildId);
    if (timeout) {
      clearTimeout(timeout);
      this.executionTimeouts.delete(buildId);
    }
    
    // Clear the progress interval
    const progressInterval = this.progressIntervals.get(buildId);
    if (progressInterval) {
      clearInterval(progressInterval);
      this.progressIntervals.delete(buildId);
    }
  }
}
