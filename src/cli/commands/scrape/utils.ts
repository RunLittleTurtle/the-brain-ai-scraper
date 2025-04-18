/**
 * CLI Utilities
 * 
 * Shared utilities for CLI commands
 */
import chalk from 'chalk';
import fetch from 'node-fetch';
import { getConfig } from '../../config.js';
import { ApiResponse } from './types.js';

// Default API base URL
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Make authenticated API request
 */
export async function makeApiRequest(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<Response> {
  const config = getConfig();
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return fetch(`${API_BASE_URL}${endpoint}`, options);
}

/**
 * Format error message from API response
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'An unknown error occurred';
  }
}

/**
 * Display performance metrics for MCP orchestration
 */
export function displayPerformanceMetrics(data: ApiResponse): void {
  if (!data.performance_metrics) return;
  
  console.log(chalk.magenta.bold('\nPerformance Metrics:'));
  
  if (data.performance_metrics.classic_time_ms) {
    console.log(chalk.magenta(`Classic Engine: ${(data.performance_metrics.classic_time_ms / 1000).toFixed(2)}s`));
  }
  
  if (data.performance_metrics.mcp_time_ms) {
    console.log(chalk.magenta(`MCP Engine: ${(data.performance_metrics.mcp_time_ms / 1000).toFixed(2)}s`));
  }
  
  if (data.performance_metrics.tool_selection_reasoning) {
    console.log(chalk.magenta(`Tool Selection: ${data.performance_metrics.tool_selection_reasoning}`));
  }
}
