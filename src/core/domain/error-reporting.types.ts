/**
 * Types for structured error reporting
 * 
 * These types define the structure for detailed error reporting throughout the application.
 * They are used to standardize error information capture and storage.
 */

/**
 * Standard error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Standardized error categories for better classification and filtering
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  SCRAPING = 'scraping',
  ANALYSIS = 'analysis',
  EXECUTION = 'execution',
  CONFIGURATION = 'configuration',
  REFINEMENT = 'refinement',
  SAMPLE_GENERATION = 'sample_generation',
  BUILD_PROCESSOR = 'build_processor',
  UNKNOWN = 'unknown'
}

/**
 * Structure for detailed error information
 */
export interface ErrorDetails {
  /**
   * Error message providing a clear description of the problem
   */
  message: string;
  
  /**
   * Error category for classification
   */
  category: ErrorCategory;
  
  /**
   * Error severity level
   */
  severity: ErrorSeverity;
  
  /**
   * Original error type (e.g., PrismaClientKnownRequestError, TypeError)
   */
  type?: string;
  
  /**
   * Error code if available (e.g., from Prisma or another system)
   */
  code?: string;
  
  /**
   * Error stack trace for debugging (should be sanitized before exposure via API)
   */
  stack?: string;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: string;
  
  /**
   * Context information about the error (e.g., build ID, operation being performed)
   */
  context?: Record<string, any>;
  
  /**
   * Additional metadata about the error
   */
  metadata?: Record<string, any>;
}

/**
 * Extended error details with troubleshooting and mitigation information
 * Primarily for API responses to help clients understand and resolve errors
 */
export interface ExtendedErrorDetails extends ErrorDetails {
  /**
   * Suggestions for troubleshooting the error
   */
  troubleshooting?: string[];
  
  /**
   * Possible workarounds or alternative approaches
   */
  workarounds?: string[];
  
  /**
   * Reference documentation URLs
   */
  docs?: string[];
}
