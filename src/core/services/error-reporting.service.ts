/**
 * Error Reporting Service
 * 
 * Provides utilities for creating, formatting, and reporting structured error details
 * throughout the application. Centralizes error handling best practices.
 */

import { ErrorDetails, ErrorCategory, ErrorSeverity } from '../domain/error-reporting.types.js';

/**
 * Creates standardized error details from various error sources
 */
export class ErrorReportingService {
  /**
   * Creates a standard error details object from any error and additional context
   * 
   * @param error - The original error object
   * @param category - Error category for classification (defaults to UNKNOWN)
   * @param severity - Error severity level (defaults to ERROR)
   * @param context - Additional context information
   * @returns Structured error details
   */
  createErrorDetails(
    error: Error | string | unknown,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: Record<string, any> = {}
  ): ErrorDetails {
    let message: string;
    let stack: string | undefined;
    let type: string | undefined;
    let code: string | undefined;
    
    // Extract error information based on the error type
    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
      type = error.constructor.name;
      
      // Extract code from known error types
      if ('code' in error && typeof (error as any).code === 'string') {
        code = (error as any).code;
      }
    } else if (typeof error === 'string') {
      message = error;
    } else {
      // Handle unknown error types
      message = 'Unknown error occurred';
      if (error !== null && error !== undefined) {
        try {
          message = JSON.stringify(error);
        } catch (e) {
          message = String(error);
        }
      }
    }
    
    // Return the standardized error details
    return {
      message,
      category,
      severity,
      type,
      code,
      stack,
      timestamp: new Date().toISOString(),
      context,
    };
  }
  
  /**
   * Creates database error details with appropriate category and context
   * 
   * @param error - Original database error
   * @param context - Additional context information
   * @returns Structured error details
   */
  createDatabaseErrorDetails(
    error: Error | unknown,
    context: Record<string, any> = {}
  ): ErrorDetails {
    return this.createErrorDetails(
      error,
      ErrorCategory.DATABASE,
      ErrorSeverity.ERROR,
      context
    );
  }
  
  /**
   * Creates analysis error details for LLM/AI processing errors
   * 
   * @param error - Original analysis error
   * @param context - Additional context information
   * @returns Structured error details
   */
  createAnalysisErrorDetails(
    error: Error | unknown,
    context: Record<string, any> = {}
  ): ErrorDetails {
    return this.createErrorDetails(
      error,
      ErrorCategory.ANALYSIS,
      ErrorSeverity.ERROR,
      context
    );
  }
  
  /**
   * Creates scraping execution error details
   * 
   * @param error - Original scraping error
   * @param context - Additional context information
   * @returns Structured error details
   */
  createScrapingErrorDetails(
    error: Error | unknown,
    context: Record<string, any> = {}
  ): ErrorDetails {
    return this.createErrorDetails(
      error,
      ErrorCategory.SCRAPING,
      ErrorSeverity.ERROR,
      context
    );
  }
  
  /**
   * Creates execution error details for general execution failures
   * 
   * @param error - Original execution error
   * @param context - Additional context information
   * @returns Structured error details
   */
  createExecutionErrorDetails(
    error: Error | unknown,
    context: Record<string, any> = {}
  ): ErrorDetails {
    return this.createErrorDetails(
      error,
      ErrorCategory.EXECUTION,
      ErrorSeverity.ERROR,
      context
    );
  }
  
  /**
   * Sanitizes error details for API responses by removing sensitive information
   * 
   * @param errorDetails - The original error details
   * @returns Sanitized error details safe for external use
   */
  sanitizeForApiResponse(errorDetails: ErrorDetails): Partial<ErrorDetails> {
    // Create a copy without the stack trace and with limited context
    const { stack, context, metadata, ...safeDetails } = errorDetails;
    
    // Include only safe context fields if needed
    const safeContext: Record<string, any> = {};
    
    if (context) {
      // Only include safe context fields
      const safeFields = ['buildId', 'runId', 'operationType', 'timestamp'];
      safeFields.forEach(field => {
        if (field in context) {
          safeContext[field] = context[field];
        }
      });
    }
    
    return {
      ...safeDetails,
      ...(Object.keys(safeContext).length > 0 ? { context: safeContext } : {})
    };
  }
}

// Export a singleton instance for use throughout the application
export const errorReportingService = new ErrorReportingService();
