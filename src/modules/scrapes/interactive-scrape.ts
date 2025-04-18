/**
 * Interactive Scrape Implementation
 * 
 * This file contains the actual implementations for the types 
 * declared in interactive-scrape.d.ts
 */

import { Type, TObject } from '@sinclair/typebox';
import { ApiResponse } from './interactive-scrape.d.js';

/**
 * Type guard to check if an object is an API response
 */
export function isApiResponse(obj: any): obj is ApiResponse {
  return obj && 
    typeof obj === 'object' && 
    typeof obj.job_id === 'string' &&
    typeof obj.status === 'string';
}

/**
 * Convert error to standardized API response format
 */
export function errorToApiResponse(error: string | Error, message?: string): ApiResponse {
  const errorMessage = error instanceof Error ? error.message : error;
  const responseMessage = message || 'An error occurred';
  
  return {
    job_id: 'error',
    status: 'error',
    error: errorMessage,
    message: responseMessage,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * TypeBox schema conversion helper
 */
export function toTypeboxObject<T>(obj: T): TObject<any> {
  // This is a placeholder implementation - in a real environment,
  // you would need to convert the object to a proper TypeBox schema
  return Type.Object({
    job_id: Type.String(),
    status: Type.String(),
    message: Type.Optional(Type.String()),
    error: Type.Optional(Type.String()),
    // Add other properties as needed
  }) as any;
}
