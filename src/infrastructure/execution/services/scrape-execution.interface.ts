/**
 * Scrape Execution Interfaces
 * 
 * Defines the contracts for the modular scrape execution components
 */

import { UniversalConfigurationPackageFormatV1 } from '../../../core/domain/configuration-package.types.js';
import { ToolExecutionResult } from '../tool.interface.js';
import { ErrorDetails } from '../../../core/domain/error-reporting.types.js';

/**
 * Status of a scrape execution
 */
export type ScrapeExecutionStatus = 
  | 'initializing' 
  | 'running' 
  | 'paused'
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'timeout';

/**
 * Progress information for a scrape execution
 */
export interface ScrapeProgress {
  totalUrls: number;
  processedUrls: number;
  successfulUrls: number;
  failedUrls: number;
  retriedUrls: number;
  currentBatch: number;
  totalBatches: number;
}

/**
 * State of a scrape execution
 */
export interface ScrapeExecutionState {
  buildId: string;
  status: ScrapeExecutionStatus;
  progress: ScrapeProgress;
  startTime: Date;
  lastUpdateTime: Date;
  endTime?: Date;
  cancelRequested: boolean;
  pauseRequested: boolean;
  error?: string;
  results?: ToolExecutionResult[];
}

/**
 * Options for a full scrape execution
 */
export interface ScrapeExecutionOptions {
  timeoutMs?: number;
  batchSize?: number;
  rateLimitRps?: number;
  maxRetryAttempts?: number;
}

/**
 * Interface for the main scrape execution service
 */
export interface IScrapeExecutionService {
  /**
   * Start a full scrape execution for a build
   */
  startScrape(
    buildId: string, 
    configPackage: UniversalConfigurationPackageFormatV1,
    options?: ScrapeExecutionOptions
  ): Promise<ScrapeExecutionState>;
  
  /**
   * Get the current state of a scrape execution
   */
  getExecutionState(buildId: string): ScrapeExecutionState | null;
  
  /**
   * Cancel an active scrape execution
   */
  cancelExecution(buildId: string): Promise<boolean>;
  
  /**
   * Pause an active scrape execution
   */
  pauseExecution(buildId: string): Promise<boolean>;
  
  /**
   * Resume a paused scrape execution
   */
  resumeExecution(buildId: string): Promise<boolean>;
}

/**
 * Interface for the state management service
 */
export interface IScrapeStateManager {
  /**
   * Create and store a new execution state
   */
  createExecutionState(
    buildId: string, 
    targetUrls: string[], 
    options: ScrapeExecutionOptions
  ): ScrapeExecutionState;
  
  /**
   * Get the execution state for a build
   */
  getState(buildId: string): ScrapeExecutionState | null;
  
  /**
   * Update the execution status
   */
  updateStatus(
    buildId: string, 
    status: ScrapeExecutionStatus, 
    error?: string
  ): ScrapeExecutionState | null;
  
  /**
   * Update progress information
   */
  updateProgress(
    buildId: string, 
    progressUpdate: Partial<ScrapeProgress>
  ): ScrapeExecutionState | null;
  
  /**
   * Mark an execution as cancelled
   */
  markCancelled(buildId: string): ScrapeExecutionState | null;
  
  /**
   * Mark an execution as paused
   */
  markPaused(buildId: string): ScrapeExecutionState | null;
  
  /**
   * Mark an execution as resumed
   */
  markResumed(buildId: string): ScrapeExecutionState | null;
  
  /**
   * Mark an execution as completed
   */
  markCompleted(
    buildId: string, 
    results: ToolExecutionResult[]
  ): ScrapeExecutionState | null;
  
  /**
   * Mark an execution as failed
   */
  markFailed(
    buildId: string, 
    error: string, 
    results?: ToolExecutionResult[]
  ): ScrapeExecutionState | null;
}

/**
 * Interface for the rate limiting service
 */
export interface IRateLimiter {
  /**
   * Check if a request can be executed now based on rate limit
   */
  canMakeRequest(): boolean;
  
  /**
   * Calculate delay required before making next request
   */
  getDelayMs(): number;
  
  /**
   * Await until we can make a request according to rate limits
   */
  waitForSlot(): Promise<void>;
  
  /**
   * Track a new request being made
   */
  trackRequest(): void;
  
  /**
   * Execute a function with rate limiting applied
   */
  execute<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Interface for the retry management service
 */
export interface IRetryManager {
  /**
   * Track a failed URL for potential retry
   */
  trackFailedUrl(url: string, error: string | Error): {
    canRetry: boolean;
    attemptsMade: number;
    waitTimeMs?: number;
  };
  
  /**
   * Get all URLs that are due for retry
   */
  getUrlsDueForRetry(): string[];
  
  /**
   * Track a successful retry
   */
  trackSuccessfulRetry(url: string): void;
  
  /**
   * Get statistics about retries
   */
  getRetryStats(): {
    pendingRetries: number;
    maxRetriesExceeded: number;
  };
}

/**
 * Interface for handling errors during scrape execution
 */
export interface IScrapeErrorHandler {
  /**
   * Handle a scrape execution error
   */
  handleExecutionError(
    buildId: string,
    error: Error | string,
    context?: Record<string, any>
  ): Promise<ErrorDetails>;
  
  /**
   * Handle a timeout during scrape execution
   */
  handleTimeout(
    buildId: string,
    executionState: ScrapeExecutionState
  ): Promise<ErrorDetails>;
  
  /**
   * Handle a batch processing error
   */
  handleBatchError(
    buildId: string,
    batchIndex: number,
    error: Error | string,
    urls: string[]
  ): Promise<ErrorDetails>;
}
