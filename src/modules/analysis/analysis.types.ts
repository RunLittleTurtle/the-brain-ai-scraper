import { UniversalConfigurationPackageFormatV1 } from "../../core/domain/configuration-package.types";

// Input for the analysis service
export interface AnalysisInput {
  buildId: string;
  userObjective: string;
  targetUrls: string[];
}

// Output from the analysis service
export interface AnalysisResult {
  success: boolean;
  package?: UniversalConfigurationPackageFormatV1;
  error?: string; // Error message if analysis failed
  failureReason?: 'unclear_objective' | 'no_suitable_tools' | 'url_fetch_error' | 'llm_error' | 'unknown'; // Optional: Categorized failure reason
}
