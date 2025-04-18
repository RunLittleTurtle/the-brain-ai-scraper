/**
 * Base Processor
 * 
 * Defines common functionality and dependencies for all processors
 */

import { PrismaClient, BuildStatus } from '../../generated/prisma/index.js';
import { IBuildRepository } from '../../infrastructure/db/build.repository.js';
import { errorReportingService } from '../../core/services/error-reporting.service.js';
import { ErrorCategory, ErrorSeverity } from '../../core/domain/error-reporting.types.js';
import { ExecutionEngineService } from '../../infrastructure/execution/execution.service.js';
import { AnalysisService } from '../../modules/analysis/analysis.service.js';

/**
 * Base processor class that provides common functionality for all processors
 */
export abstract class BaseProcessor {
  /**
   * Initialize the BaseProcessor with required dependencies
   * 
   * @param buildRepository Repository for build data access
   * @param prisma Prisma client for direct database access
   * @param errorCategory Default error category for this processor
   */
  constructor(
    protected buildRepository: IBuildRepository,
    protected prisma: PrismaClient,
    protected errorCategory: ErrorCategory
  ) {}

  /**
   * Log a standard message with the processor name
   * 
   * @param message Message to log
   * @param buildId Optional build ID for context
   */
  protected log(message: string, buildId?: string): void {
    const buildContext = buildId ? ` for build ${buildId}` : '';
    console.log(`[${this.constructor.name}] ${message}${buildContext}`);
  }

  /**
   * Handle an error by logging it and updating the build status
   * 
   * @param error Error that was caught
   * @param buildId Build ID associated with the error
   * @param context Additional context for error reporting
   * @param failureStatus Status to set the build to on failure
   */
  protected async handleError(
    error: Error | unknown,
    buildId: string,
    context: Record<string, any>,
    failureStatus: BuildStatus
  ): Promise<void> {
    console.error(`[${this.constructor.name}] Error processing build ${buildId}:`, error);
    
    // Create detailed error information
    const errorDetails = errorReportingService.createErrorDetails(
      error,
      this.errorCategory,
      ErrorSeverity.ERROR,
      {
        buildId,
        ...context
      }
    );
    
    // Update build with error details
    await this.buildRepository.updateBuildError(buildId, errorDetails);
    
    // Update build status to FAILED
    await this.buildRepository.updateBuildStatus(buildId, failureStatus);
  }
}
