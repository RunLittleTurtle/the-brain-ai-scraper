/**
 * Scrape State Manager Service
 * 
 * Manages the state of all active scrape executions
 */

import {
  IScrapeStateManager,
  ScrapeExecutionState,
  ScrapeExecutionStatus,
  ScrapeProgress,
  ScrapeExecutionOptions
} from './scrape-execution.interface.js';
import { ToolExecutionResult } from '../tool.interface.js';

// Default batch size for processing URLs
const DEFAULT_BATCH_SIZE = 20;

// Default rate limit in requests per second
const DEFAULT_RATE_LIMIT_RPS = 5;

/**
 * Service for managing scrape execution state
 */
export class ScrapeStateManager implements IScrapeStateManager {
  private activeExecutions: Map<string, ScrapeExecutionState> = new Map();
  
  /**
   * Create and store a new execution state
   * 
   * @param buildId The ID of the build
   * @param targetUrls The list of URLs to process
   * @param options Configuration options
   */
  createExecutionState(
    buildId: string, 
    targetUrls: string[], 
    options: ScrapeExecutionOptions
  ): ScrapeExecutionState {
    // Calculate total batches
    const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
    const totalBatches = Math.ceil(targetUrls.length / batchSize);
    
    // Create the execution state
    const executionState: ScrapeExecutionState = {
      buildId,
      status: 'initializing',
      progress: {
        totalUrls: targetUrls.length,
        processedUrls: 0,
        successfulUrls: 0,
        failedUrls: 0,
        retriedUrls: 0,
        currentBatch: 0,
        totalBatches
      },
      startTime: new Date(),
      lastUpdateTime: new Date(),
      cancelRequested: false,
      pauseRequested: false
    };
    
    // Store the execution state
    this.activeExecutions.set(buildId, executionState);
    
    return executionState;
  }
  
  /**
   * Get the execution state for a build
   * 
   * @param buildId The ID of the build
   */
  getState(buildId: string): ScrapeExecutionState | null {
    return this.activeExecutions.get(buildId) || null;
  }
  
  /**
   * Update the execution status
   * 
   * @param buildId The ID of the build
   * @param status The new status
   * @param error Optional error message if status is failed or timeout
   */
  updateStatus(
    buildId: string, 
    status: ScrapeExecutionStatus, 
    error?: string
  ): ScrapeExecutionState | null {
    const executionState = this.activeExecutions.get(buildId);
    
    if (!executionState) {
      return null;
    }
    
    // Update status
    executionState.status = status;
    executionState.lastUpdateTime = new Date();
    
    // If terminal status, set end time
    if (['completed', 'failed', 'cancelled', 'timeout'].includes(status)) {
      executionState.endTime = new Date();
    }
    
    // Set error if provided
    if (error) {
      executionState.error = error;
    }
    
    // Store updated state
    this.activeExecutions.set(buildId, executionState);
    
    return executionState;
  }
  
  /**
   * Update progress information
   * 
   * @param buildId The ID of the build
   * @param progressUpdate The progress updates to apply
   */
  updateProgress(
    buildId: string, 
    progressUpdate: Partial<ScrapeProgress>
  ): ScrapeExecutionState | null {
    const executionState = this.activeExecutions.get(buildId);
    
    if (!executionState) {
      return null;
    }
    
    // Update progress fields
    executionState.progress = {
      ...executionState.progress,
      ...progressUpdate
    };
    
    // Update last update time
    executionState.lastUpdateTime = new Date();
    
    // Store updated state
    this.activeExecutions.set(buildId, executionState);
    
    return executionState;
  }
  
  /**
   * Mark an execution as cancelled
   * 
   * @param buildId The ID of the build
   */
  markCancelled(buildId: string): ScrapeExecutionState | null {
    const executionState = this.activeExecutions.get(buildId);
    
    if (!executionState) {
      return null;
    }
    
    // Set cancellation flag
    executionState.cancelRequested = true;
    
    // Update status
    executionState.status = 'cancelled';
    executionState.endTime = new Date();
    executionState.lastUpdateTime = new Date();
    
    // Store updated state
    this.activeExecutions.set(buildId, executionState);
    
    return executionState;
  }
  
  /**
   * Mark an execution as paused
   * 
   * @param buildId The ID of the build
   */
  markPaused(buildId: string): ScrapeExecutionState | null {
    const executionState = this.activeExecutions.get(buildId);
    
    if (!executionState) {
      return null;
    }
    
    // Set pause flag
    executionState.pauseRequested = true;
    
    // Update status
    executionState.status = 'paused';
    executionState.lastUpdateTime = new Date();
    
    // Store updated state
    this.activeExecutions.set(buildId, executionState);
    
    return executionState;
  }
  
  /**
   * Mark an execution as resumed
   * 
   * @param buildId The ID of the build
   */
  markResumed(buildId: string): ScrapeExecutionState | null {
    const executionState = this.activeExecutions.get(buildId);
    
    if (!executionState) {
      return null;
    }
    
    // Clear pause flag
    executionState.pauseRequested = false;
    
    // Update status
    executionState.status = 'running';
    executionState.lastUpdateTime = new Date();
    
    // Store updated state
    this.activeExecutions.set(buildId, executionState);
    
    return executionState;
  }
  
  /**
   * Mark an execution as completed
   * 
   * @param buildId The ID of the build
   * @param results The execution results
   */
  markCompleted(
    buildId: string, 
    results: ToolExecutionResult[]
  ): ScrapeExecutionState | null {
    const executionState = this.activeExecutions.get(buildId);
    
    if (!executionState) {
      return null;
    }
    
    // Update status
    executionState.status = 'completed';
    executionState.endTime = new Date();
    executionState.lastUpdateTime = new Date();
    executionState.results = results;
    
    // Store updated state
    this.activeExecutions.set(buildId, executionState);
    
    return executionState;
  }
  
  /**
   * Mark an execution as failed
   * 
   * @param buildId The ID of the build
   * @param error The error message
   * @param results Optional partial results
   */
  markFailed(
    buildId: string, 
    error: string, 
    results?: ToolExecutionResult[]
  ): ScrapeExecutionState | null {
    const executionState = this.activeExecutions.get(buildId);
    
    if (!executionState) {
      return null;
    }
    
    // Update status
    executionState.status = 'failed';
    executionState.endTime = new Date();
    executionState.lastUpdateTime = new Date();
    executionState.error = error;
    
    if (results) {
      executionState.results = results;
    }
    
    // Store updated state
    this.activeExecutions.set(buildId, executionState);
    
    return executionState;
  }
}
