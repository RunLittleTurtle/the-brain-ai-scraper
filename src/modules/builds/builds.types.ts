// src/modules/builds/builds.types.ts
// Types for builds module, particularly for refinement/feedback process

/**
 * Represents user feedback for refinement of a build's configuration
 */
export interface UserFeedback {
  /**
   * The textual feedback from the user describing issues with the current samples
   * or desired improvements for the configuration
   */
  feedback: string;
  
  /**
   * Optional array of tool hints/suggestions provided by the user
   */
  toolHints?: string[];
  
  /**
   * Optional raw context that might be useful for the refinement process
   */
  context?: Record<string, any>;
}

/**
 * Request body for the /builds/{id}/configure endpoint
 */
export interface BuildConfigureRequest {
  /**
   * User's feedback on the sample results
   */
  user_feedback: string;
  
  /**
   * Optional tool hints/suggestions to guide the refinement
   */
  tool_hints?: string[];
}

/**
 * Response for the /builds/{id}/configure endpoint
 */
export interface BuildConfigureResponse {
  /**
   * ID of the build being configured
   */
  build_id: string;
  
  /**
   * Current status of the build after configuration request
   */
  status: string;
  
  /**
   * Optional message providing additional context about the refinement process
   */
  message?: string;
}
