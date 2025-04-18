/**
 * URL Retry Manager Service
 * 
 * Manages the retry logic for failed URLs in full scrape executions
 */

import { ToolExecutionResult } from '../../infrastructure/execution/tool.interface.js';
import { UrlRetryInfo, RetryResult } from '../../infrastructure/execution/execution.types.js';

/**
 * Default values for retry configuration
 */
const DEFAULT_MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_BASE_RETRY_DELAY_MS = 5000;

/**
 * Manager for URL retry logic, including backoff strategy
 */
export class UrlRetryManager {
  private retryMap: Map<string, UrlRetryInfo> = new Map();
  private maxRetryAttempts: number;
  private baseRetryDelayMs: number;
  
  /**
   * Initialize the URL Retry Manager
   * 
   * @param options Configuration options for the retry behavior
   */
  constructor(options: {
    maxRetryAttempts?: number;
    baseRetryDelayMs?: number;
  } = {}) {
    this.maxRetryAttempts = options.maxRetryAttempts || DEFAULT_MAX_RETRY_ATTEMPTS;
    this.baseRetryDelayMs = options.baseRetryDelayMs || DEFAULT_BASE_RETRY_DELAY_MS;
  }
  
  /**
   * Track a failed URL for potential retry
   * 
   * @param url The URL that failed
   * @param error The error message or object
   * @returns Information about whether the URL can be retried
   */
  trackFailedUrl(url: string, error: string | Error): { 
    canRetry: boolean; 
    attemptsMade: number;
    waitTimeMs?: number;
  } {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    
    // Check if we already have this URL in the retry map
    const existingInfo = this.retryMap.get(url);
    
    if (existingInfo) {
      // Update existing entry
      existingInfo.attempts += 1;
      existingInfo.lastError = errorMessage;
      
      // Calculate next retry time with exponential backoff
      const backoffDelayMs = this.baseRetryDelayMs * Math.pow(2, existingInfo.attempts - 1);
      existingInfo.nextRetryTime = new Date(Date.now() + backoffDelayMs);
      
      this.retryMap.set(url, existingInfo);
      
      return {
        canRetry: existingInfo.attempts < this.maxRetryAttempts,
        attemptsMade: existingInfo.attempts,
        waitTimeMs: backoffDelayMs
      };
    } else {
      // Create new entry
      const newInfo: UrlRetryInfo = {
        url,
        attempts: 1,
        lastError: errorMessage,
        nextRetryTime: new Date(Date.now() + this.baseRetryDelayMs)
      };
      
      this.retryMap.set(url, newInfo);
      
      return {
        canRetry: 1 < this.maxRetryAttempts,
        attemptsMade: 1,
        waitTimeMs: this.baseRetryDelayMs
      };
    }
  }
  
  /**
   * Get all URLs that are due for retry
   * 
   * @returns List of URLs that should be retried now
   */
  getUrlsDueForRetry(): UrlRetryInfo[] {
    const now = new Date();
    const dueUrls: UrlRetryInfo[] = [];
    
    for (const info of this.retryMap.values()) {
      if (
        info.attempts < this.maxRetryAttempts && 
        info.nextRetryTime && 
        info.nextRetryTime <= now
      ) {
        dueUrls.push(info);
      }
    }
    
    return dueUrls;
  }
  
  /**
   * Update the retry map with a successful result
   * 
   * @param url The URL that succeeded
   * @param result The successful execution result
   */
  trackSuccessfulUrl(url: string, result: ToolExecutionResult): void {
    // Remove from retry map if present
    this.retryMap.delete(url);
  }
  
  /**
   * Get all URLs that have exceeded retry limits
   * 
   * @returns List of URL retry info objects that have reached max attempts
   */
  getFailedUrls(): UrlRetryInfo[] {
    const failedUrls: UrlRetryInfo[] = [];
    
    for (const info of this.retryMap.values()) {
      if (info.attempts >= this.maxRetryAttempts) {
        failedUrls.push(info);
      }
    }
    
    return failedUrls;
  }
  
  /**
   * Clear all retry data
   */
  clear(): void {
    this.retryMap.clear();
  }
  
  /**
   * Get statistics about retries
   */
  getRetryStats(): {
    totalTracked: number;
    pendingRetries: number;
    maxRetriesExceeded: number;
  } {
    let pendingRetries = 0;
    let maxRetriesExceeded = 0;
    
    for (const info of this.retryMap.values()) {
      if (info.attempts >= this.maxRetryAttempts) {
        maxRetriesExceeded++;
      } else {
        pendingRetries++;
      }
    }
    
    return {
      totalTracked: this.retryMap.size,
      pendingRetries,
      maxRetriesExceeded
    };
  }
}
