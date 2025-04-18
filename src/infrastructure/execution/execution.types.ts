/**
 * Execution related types for the Full Scrape Execution Engine
 */
import { ToolExecutionResult } from './tool.interface.js';

/**
 * Result of a package execution
 */
export interface ExecutionResult {
  success: boolean;
  error?: string;
  results: ToolExecutionResult[];
  metadata?: Record<string, any>;
}

/**
 * Result of a retry attempt
 */
export interface RetryResult {
  success: boolean;
  url: string;
  attempts: number;
  finalResult?: ToolExecutionResult;
  error?: string;
}

/**
 * Options for the full scrape execution
 */
export interface FullScrapeOptions {
  timeoutMs?: number;
  batchSize?: number;
  rateLimitRps?: number;
  maxRetryAttempts?: number;
  retryDelayMs?: number;
  progressUpdateIntervalMs?: number;
}

/**
 * URL retry information
 */
export interface UrlRetryInfo {
  url: string;
  attempts: number;
  lastError: string;
  nextRetryTime?: Date;
}
