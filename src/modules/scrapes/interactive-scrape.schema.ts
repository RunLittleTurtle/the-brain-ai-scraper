/**
 * Schema definitions for interactive scraping API
 * 
 * Supports the complete user flow for any scraping task:
 * 1. User submits request
 * 2. System searches knowledge base
 * 3. System proposes approach
 * 4. User reviews proposal
 * 5. System generates samples
 * 6. User reviews samples
 * 7. System refines (if needed)
 * 8. System performs full extraction
 */
import { Static, Type } from '@sinclair/typebox';
import { BuildStatus } from '../../generated/prisma/index.js';

// --- Params Schemas --- //

export const ScrapeJobIdParamsSchema = Type.Object({
  job_id: Type.String({ 
    format: 'uuid', 
    description: 'The unique identifier for the scrape job.' 
  })
});

export type ScrapeJobIdParams = Static<typeof ScrapeJobIdParamsSchema>;

// --- Request Body Schemas --- //

export const InteractiveScrapeRequestSchema = Type.Object({
  target_urls: Type.Array(Type.String({ format: 'uri' }), { 
    minItems: 1, 
    description: 'List of target URLs to process' 
  }),
  user_objective: Type.String({ 
    minLength: 1, 
    description: 'Clear description of what data to extract and the user goal' 
  }),
  max_results: Type.Optional(Type.Number({
    description: 'Maximum number of results to retrieve',
    default: 100,
    minimum: 1,
    maximum: 1000
  })),
  additional_context: Type.Optional(Type.Record(Type.String(), Type.Any(), {
    description: 'Any additional context to help the system understand the extraction needs'
  }))
});

export type InteractiveScrapeRequest = Static<typeof InteractiveScrapeRequestSchema>;

export const ScrapeProposalFeedbackSchema = Type.Object({
  approved: Type.Boolean({
    description: 'Whether the user approves the proposed scraping approach'
  }),
  additional_fields: Type.Optional(Type.Array(Type.String(), {
    description: 'Additional fields to extract beyond the proposed fields'
  })),
  remove_fields: Type.Optional(Type.Array(Type.String(), {
    description: 'Fields to remove from the proposed extraction'
  })),
  custom_instructions: Type.Optional(Type.String({
    description: 'Additional instructions or modifications to the proposed approach'
  }))
});

export type ScrapeProposalFeedback = Static<typeof ScrapeProposalFeedbackSchema>;

export const SampleResultsFeedbackSchema = Type.Object({
  approved: Type.Boolean({
    description: 'Whether the user approves the sample results'
  }),
  field_issues: Type.Optional(Type.Record(Type.String(), Type.String(), {
    description: 'Issues with specific fields in the format {field_name: issue_description}'
  })),
  custom_instructions: Type.Optional(Type.String({
    description: 'Additional instructions for refining the extraction approach'
  }))
});

export type SampleResultsFeedback = Static<typeof SampleResultsFeedbackSchema>;

// --- Response Schemas --- //

export const InteractiveScrapeResponseSchema = Type.Object({
  job_id: Type.String({ 
    format: 'uuid', 
    description: 'The unique identifier for the scrape job' 
  }),
  status: Type.String({
    description: 'Current status of the scrape job',
    enum: ['pending', 'searching_knowledge_base', 'generating_proposal', 'waiting_for_approval', 
           'generating_samples', 'waiting_for_sample_feedback', 'refining_approach', 
           'executing_full_scrape', 'completed', 'failed', 'cancelled']
  }),
  message: Type.String({
    description: 'Human-readable description of the current job status'
  }),
  error: Type.Optional(Type.String({
    description: 'Error message if the job failed'
  }))
});

export type InteractiveScrapeResponse = Static<typeof InteractiveScrapeResponseSchema>;

export const ScrapeProposalSchema = Type.Object({
  job_id: Type.String({ format: 'uuid' }),
  status: Type.String(),
  proposed_approach: Type.Object({
    tool: Type.String({
      description: 'The primary scraping tool that will be used',
      examples: ['playwright_stealth_v1', 'cheerio_v2']
    }),
    output_schema: Type.Record(Type.String(), Type.Object({
      type: Type.String(),
      description: Type.String()
    })),
    estimated_completion_time: Type.String(),
    sample_size: Type.Number()
  }),
  message: Type.Optional(Type.String()),
  error: Type.Optional(Type.String())
});

export type ScrapeProposal = Static<typeof ScrapeProposalSchema>;

export const ScrapeJobStatusSchema = Type.Object({
  job_id: Type.String({ format: 'uuid' }),
  status: Type.String(),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' }),
  progress: Type.Optional(Type.Object({
    total_urls: Type.Number(),
    processed_urls: Type.Number(),
    percentage_complete: Type.Number()
  })),
  proposal: Type.Optional(Type.Ref('ScrapeProposalSchema')),
  sample_results: Type.Optional(Type.Array(Type.Any())),
  error: Type.Optional(Type.String()),
  message: Type.Optional(Type.String()),
  total_results: Type.Optional(Type.Number())
});

export type ScrapeJobStatus = Static<typeof ScrapeJobStatusSchema>;

export const ScrapeResultsSchema = Type.Object({
  job_id: Type.String({ format: 'uuid' }),
  status: Type.String(),
  total_results: Type.Number(),
  results: Type.Array(Type.Any()),
  execution_time_ms: Type.Number(),
  message: Type.Optional(Type.String()),
  error: Type.Optional(Type.String())
});

export type ScrapeResults = Static<typeof ScrapeResultsSchema>;
