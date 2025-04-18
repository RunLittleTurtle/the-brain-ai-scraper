/**
 * CLI Types
 * 
 * Shared types and interfaces for CLI commands
 */

// Command option interfaces
export interface CreateScrapeOptions {
  urls?: string;
  maxResults?: string;
  context?: string;
  orchestrationMode?: 'classic' | 'mcp' | 'dual' | 'default';
}

export interface StatusOptions {
  watch?: boolean;
  interval?: string;
}

export interface ProposalFeedbackOptions {
  approve?: boolean;
  reject?: boolean;
  addFields?: string;
  removeFields?: string;
  instructions?: string;
}

export interface SampleFeedbackOptions {
  approve?: boolean;
  reject?: boolean;
  fieldIssues?: string;
  instructions?: string;
}

export interface ResultsOptions {
  format?: 'json' | 'csv';
  output?: string;
}

// API Response interface
export interface ApiResponse {
  status: string;
  job_id: string;
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
  execution_time_ms?: number;
  total_results?: number;
  performance_metrics?: {
    classic_time_ms?: number;
    mcp_time_ms?: number;
    tool_selection_reasoning?: string;
  };
}
