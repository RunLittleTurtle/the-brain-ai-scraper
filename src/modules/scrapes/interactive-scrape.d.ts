/**
 * Interactive Scrape Type Declarations
 * 
 * This file addresses type mismatches in the controllers
 */

// Import necessary types from Fastify schema library
import { Type, TObject, TString, TNumber, TArray, TAny, TOptional } from '@sinclair/typebox';

/**
 * Response type for API operations - standardized structure
 */
export interface ApiResponse {
  job_id: string;
  status: string;
  message?: string;
  error?: string;
  created_at: string;
  updated_at: string;
  progress?: {
    total_urls: number;
    processed_urls: number;
    percentage_complete: number;
  };
  proposal?: unknown;
  sample_results?: any[];
  results?: any[];
  total_results?: number;
  execution_time_ms?: number;
  performance_metrics?: {
    classic_time_ms?: number;
    mcp_time_ms?: number;
    tool_selection_reasoning?: string;
  };
}

/**
 * Type guard to check if an object is an API response
 */
export function isApiResponse(obj: any): obj is ApiResponse;

/**
 * Convert error to standardized API response format
 */
export function errorToApiResponse(error: string | Error, message?: string): ApiResponse;

// TypeBox schema conversion helper
export function toTypeboxObject<T>(obj: T): TObject<any>;
