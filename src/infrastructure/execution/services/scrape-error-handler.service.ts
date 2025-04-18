/**
 * Scrape Error Handler Service
 * 
 * Handles errors that occur during scrape executions
 */

import { IBuildRepository } from '../../db/build.repository.js';
import { 
  ErrorCategory, 
  ErrorDetails, 
  ErrorSeverity 
} from '../../../core/domain/error-reporting.types.js';
import { 
  IScrapeErrorHandler,
  ScrapeExecutionState 
} from './scrape-execution.interface.js';

/**
 * Service for handling errors during scrape executions
 */
export class ScrapeErrorHandler implements IScrapeErrorHandler {
  /**
   * Initialize the error handler
   */
  constructor(
    private buildRepository: IBuildRepository,
    private errorReportingService: any
  ) {}
  
  /**
   * Handle a scrape execution error
   * 
   * @param buildId The ID of the build
   * @param error The error that occurred
   * @param context Additional context for the error
   */
  async handleExecutionError(
    buildId: string,
    error: Error | string,
    context: Record<string, any> = {}
  ): Promise<ErrorDetails> {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Create detailed error information
    const errorDetails: ErrorDetails = {
      message: errorMessage,
      category: ErrorCategory.SCRAPING,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      type: error instanceof Error ? error.constructor.name : 'Error',
      stack: errorStack,
      context: {
        buildId,
        operation: 'fullScrape.execution',
        ...context
      }
    };
    
    return errorDetails;
  }
  
  /**
   * Handle a timeout during scrape execution
   * 
   * @param buildId The ID of the build
   * @param executionState The current execution state
   */
  async handleTimeout(
    buildId: string,
    executionState: ScrapeExecutionState
  ): Promise<ErrorDetails> {
    // Create detailed error information
    const errorDetails: ErrorDetails = {
      message: 'Scrape execution timed out',
      category: ErrorCategory.SCRAPING,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      type: 'TimeoutError',
      context: {
        buildId,
        operation: 'fullScrape.timeout',
        elapsedTimeMs: executionState.endTime 
          ? executionState.endTime.getTime() - executionState.startTime.getTime() 
          : new Date().getTime() - executionState.startTime.getTime(),
        processedUrls: executionState.progress.processedUrls,
        totalUrls: executionState.progress.totalUrls,
        successfulUrls: executionState.progress.successfulUrls,
        failedUrls: executionState.progress.failedUrls
      }
    };
    
    return errorDetails;
  }
  
  /**
   * Handle a batch processing error
   * 
   * @param buildId The ID of the build
   * @param batchIndex The index of the batch that failed
   * @param error The error that occurred
   * @param urls The URLs in the batch
   */
  async handleBatchError(
    buildId: string,
    batchIndex: number,
    error: Error | string,
    urls: string[]
  ): Promise<ErrorDetails> {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Create detailed error information
    const errorDetails: ErrorDetails = {
      message: `Error processing batch ${batchIndex + 1}: ${errorMessage}`,
      category: ErrorCategory.SCRAPING,
      severity: ErrorSeverity.WARNING, // Warning since it's just one batch
      timestamp: new Date().toISOString(),
      type: error instanceof Error ? error.constructor.name : 'Error',
      stack: errorStack,
      context: {
        buildId,
        operation: 'fullScrape.batchProcessing',
        batchIndex,
        batchSize: urls.length,
        affectedUrls: urls
      }
    };
    
    return errorDetails;
  }
}
