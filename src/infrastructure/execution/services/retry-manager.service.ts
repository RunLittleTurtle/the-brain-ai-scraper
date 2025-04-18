/**
 * Retry Manager Service
 * 
 * Manages the retry logic for failed URLs in scrape executions
 */

import { IRetryManager } from './scrape-execution.interface.js';

// Default maximum retry attempts
const DEFAULT_MAX_RETRY_ATTEMPTS = 3;

// Default base delay between retries in milliseconds
const DEFAULT_BASE_RETRY_DELAY_MS = 5000;

// Information about a failed URL
interface RetryInfo {
  url: string;
  attempts: number;
  lastError: string;
  nextRetryTime?: Date;
}

/**
 * Service for managing retry logic for failed URLs
 */
export class RetryManager implements IRetryManager {
  private retryMap: Map<string, RetryInfo> = new Map();
  private maxRetryAttempts: number;
  private baseRetryDelayMs: number;
  
  /**
   * Initialize the retry manager
   * 
   * @param maxRetryAttempts Maximum number of retry attempts (default: 3)
   * @param baseRetryDelayMs Base delay between retries in milliseconds (default: 5000)
   */
  constructor(
    maxRetryAttempts: number = DEFAULT_MAX_RETRY_ATTEMPTS,
    baseRetryDelayMs: number = DEFAULT_BASE_RETRY_DELAY_MS
  ) {
    this.maxRetryAttempts = maxRetryAttempts;
    this.baseRetryDelayMs = baseRetryDelayMs;
  }
  
  /**
   * Track a failed URL for potential retry
   * 
   * @param url The URL that failed
   * @param error The error message or object
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
      const newInfo: RetryInfo = {
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
   */
  getUrlsDueForRetry(): string[] {
    const now = new Date();
    const dueUrls: string[] = [];
    
    for (const [url, info] of this.retryMap.entries()) {
      if (
        info.attempts < this.maxRetryAttempts && 
        info.nextRetryTime && 
        info.nextRetryTime <= now
      ) {
        dueUrls.push(url);
      }
    }
    
    return dueUrls;
  }
  
  /**
   * Track a successful retry
   * 
   * @param url The URL that was successfully retried
   */
  trackSuccessfulRetry(url: string): void {
    // Remove from retry map
    this.retryMap.delete(url);
  }
  
  /**
   * Get statistics about retries
   */
  getRetryStats(): {
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
      pendingRetries,
      maxRetriesExceeded
    };
  }
  
  /**
   * Set the maximum number of retry attempts
   * 
   * @param maxAttempts Maximum number of retry attempts
   */
  setMaxRetryAttempts(maxAttempts: number): void {
    this.maxRetryAttempts = maxAttempts;
  }
  
  /**
   * Set the base delay between retries
   * 
   * @param baseDelayMs Base delay in milliseconds
   */
  setBaseRetryDelay(baseDelayMs: number): void {
    this.baseRetryDelayMs = baseDelayMs;
  }
  
  /**
   * Clear all retry data
   */
  clear(): void {
    this.retryMap.clear();
  }
}
