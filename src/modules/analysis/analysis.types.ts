import { UniversalConfigurationPackageFormatV1 } from "../../core/domain/configuration-package.types.js";
/**
 * Input for the analysis service, representing the user's build request.
 */
export interface AnalysisInput {
  buildId: string;
  userObjective: string;
  targetUrls: string[];
}

/**
 * Output from the analysis service.
 *
 * If success is true, 'package' MUST be present (non-undefined).
 * If success is false, 'package' MUST be absent (undefined) and 'error' should be provided.
 */
export type AnalysisResult =
  | {
      success: true;
      package: UniversalConfigurationPackageFormatV1;
      error?: never;
      failureReason?: never;
    }
  | {
      success: false;
      package?: never;
      error: string;
      failureReason?: 'unclear_objective' | 'no_suitable_tools' | 'url_fetch_error' | 'llm_error' | 'unknown';
    };

/**
 * Input for the refinement service, representing a request to refine a configuration based on user feedback.
 */
export interface RefinementInput {
  buildId: string;
  originalObjective: string;
  previousPackage: UniversalConfigurationPackageFormatV1;
  sampleResults: any[];
  userFeedback: string;
  toolHints?: string[];
}

/**
 * Output from the refinement service.
 *
 * If success is true, 'package' MUST be present (non-undefined).
 * If success is false, 'package' MUST be absent (undefined) and 'error' should be provided.
 */
export type RefinementResult =
  | {
      success: true;
      package: UniversalConfigurationPackageFormatV1;
      error?: never;
      failureReason?: never;
    }
  | {
      success: false;
      package?: never;
      error: string;
      failureReason?: 'unclear_feedback' | 'no_suitable_tools' | 'llm_error' | 'unknown';
    };
