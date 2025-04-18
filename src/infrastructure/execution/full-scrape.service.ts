/**
 * Full Scrape Execution Service - Re-export
 * 
 * This file re-exports the modular implementation of the Full Scrape Execution Service.
 * The original monolithic implementation has been refactored into separate, focused service components.
 */

// Re-export the main service and interfaces from the modular implementation
export { ScrapeExecutionService as FullScrapeExecutionService } from './services/scrape-execution.service.js';
export {
  ScrapeExecutionState,
  ScrapeExecutionStatus,
  ScrapeProgress,
  ScrapeExecutionOptions
} from './services/scrape-execution.interface.js';

/**
 * DEPRECATED: This file is being maintained for backward compatibility only.
 * 
 * The full implementation has been moved to:
 * - services/scrape-execution.service.ts (main orchestration service)
 * - services/scrape-state-manager.service.ts (execution state management)
 * - services/rate-limiter.service.ts (rate limiting)
 * - services/retry-manager.service.ts (retry handling)
 * - services/scrape-error-handler.service.ts (error handling)
 * 
 * Please use the ScrapeExecutionService (exported as FullScrapeExecutionService) from this file
 * for all new code. The interface remains compatible with the original implementation.
 */
