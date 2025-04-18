/**
 * Rate Limiter Service
 * 
 * Controls the rate of requests during scraping operations
 */

import { IRateLimiter } from './scrape-execution.interface.js';

// Default rate limit in requests per second
const DEFAULT_RATE_LIMIT_RPS = 5;

/**
 * Service for rate limiting requests during scraping operations
 */
export class RateLimiter implements IRateLimiter {
  private rateLimit: number;
  private requestTimes: number[] = [];
  private windowSizeMs: number;
  
  /**
   * Initialize the rate limiter
   * 
   * @param rps Requests per second limit (default: 5)
   * @param windowSizeMs Size of the sliding window in milliseconds (default: 1000)
   */
  constructor(rps: number = DEFAULT_RATE_LIMIT_RPS, windowSizeMs: number = 1000) {
    this.rateLimit = rps;
    this.windowSizeMs = windowSizeMs;
  }
  
  /**
   * Check if a request can be executed now based on rate limit
   * 
   * @returns True if request can be executed, false otherwise
   */
  canMakeRequest(): boolean {
    if (this.rateLimit <= 0) {
      return true; // No rate limiting
    }
    
    const now = Date.now();
    
    // Clear outdated request times
    this.requestTimes = this.requestTimes.filter(time => (now - time) < this.windowSizeMs);
    
    // Check if we're under the limit
    return this.requestTimes.length < this.rateLimit;
  }
  
  /**
   * Calculate delay required before making next request
   * 
   * @returns Time to wait in milliseconds (0 if can proceed immediately)
   */
  getDelayMs(): number {
    if (this.rateLimit <= 0) {
      return 0; // No rate limiting
    }
    
    const now = Date.now();
    
    // Clear outdated request times
    this.requestTimes = this.requestTimes.filter(time => (now - time) < this.windowSizeMs);
    
    // If under the limit, no delay needed
    if (this.requestTimes.length < this.rateLimit) {
      return 0;
    }
    
    // Calculate when the oldest request will drop out of the window
    const oldestTime = Math.min(...this.requestTimes);
    return Math.max(0, this.windowSizeMs - (now - oldestTime));
  }
  
  /**
   * Await until we can make a request according to rate limits
   * 
   * @returns Promise that resolves when rate limit allows a request
   */
  async waitForSlot(): Promise<void> {
    const delayMs = this.getDelayMs();
    
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  /**
   * Track a new request being made
   */
  trackRequest(): void {
    this.requestTimes.push(Date.now());
  }
  
  /**
   * Execute a function with rate limiting applied
   * 
   * @param fn The function to execute (should return a Promise)
   * @returns The result of the function
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    this.trackRequest();
    return fn();
  }
  
  /**
   * Update the rate limit
   * 
   * @param rps New rate limit in requests per second
   */
  setRateLimit(rps: number): void {
    this.rateLimit = rps;
  }
  
  /**
   * Get the current rate limit
   */
  getRateLimit(): number {
    return this.rateLimit;
  }
  
  /**
   * Clear all tracked requests
   */
  clear(): void {
    this.requestTimes = [];
  }
}
