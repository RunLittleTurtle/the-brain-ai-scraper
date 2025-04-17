import { Static, Type } from '@sinclair/typebox';
import { BuildStatus } from '../../generated/prisma/index.js'; // Import enum if needed for response

// Schema for the POST /builds request body
export const CreateBuildBodySchema = Type.Object({
    target_urls: Type.Array(Type.String({ format: 'uri', description: 'List of target URLs to scrape' }), {
        minItems: 1,
        description: 'At least one target URL must be provided.'
    }),
    user_objective: Type.String({
        minLength: 5, // Example: require a minimum length
        description: 'The objective or goal for this scraping build.'
    }),
    // callback_url: Type.Optional(Type.String({ format: 'uri', description: 'Optional URL for webhook notifications' }))
}, {
    description: 'Payload for creating a new build request.',
    examples: [{
        target_urls: ["https://example.com/page1", "https://anothersite.org/data"],
        user_objective: "Extract product names and prices from example.com"
    }]
});

// Schema for the 202 Accepted response for POST /builds
export const CreateBuildResponseSchema = Type.Object({
    message: Type.String(),
    build_id: Type.String({ format: 'cuid', description: 'The unique ID assigned to the build.' }),
    status: Type.Enum(BuildStatus, { description: 'The initial status of the build.' }) // Use BuildStatus enum
});

// Combine schemas for the route definition
export const createBuildSchema = {
    description: 'Initiate a new scraping build request.',
    tags: ['builds'], // OpenAPI tags
    summary: 'Create Build Request',
    body: CreateBuildBodySchema,
    response: {
        202: CreateBuildResponseSchema,
        // Add other responses like 400, 401, 500 as needed
        400: Type.Object({ message: Type.String() }), // Example Bad Request
        401: Type.Object({ message: Type.String() }), // Example Unauthorized
        500: Type.Object({ message: Type.String() })  // Example Server Error
    },
};

// --- Schemas for GET /builds/:id (Example) ---
// export const BuildIdParamsSchema = Type.Object({ buildId: Type.String({ format: 'cuid' }) });
// Define response schema for GET...
// export const getBuildSchema = { params: BuildIdParamsSchema, response: { 200: ..., 404: ... } };

// --- Schemas for POST /builds/:id/confirm ---
// Parameter schema for build_id
export const BuildIdParamsSchema = Type.Object({
  build_id: Type.String({
    // Removed format validation since 'cuid' isn't supported
    minLength: 1,
    description: 'The unique identifier for the build job.'
  })
});

// Response schema for successful confirmation
export const ConfirmBuildResponseSchema = Type.Object({
  build_id: Type.String({ description: 'The unique ID of the confirmed build' }),
  status: Type.Enum(BuildStatus, { description: 'The updated status of the build (should be CONFIRMED)' }),
  message: Type.String({ description: 'Confirmation success message' })
});

// Combined schema for the route definition
export const confirmBuildSchema = {
  description: 'Confirm a build configuration for execution',
  tags: ['builds'],
  summary: 'Confirm Build Configuration',
  params: BuildIdParamsSchema,
  response: {
    200: ConfirmBuildResponseSchema,
    400: Type.Object({ message: Type.String() }), // Bad Request
    404: Type.Object({ message: Type.String() }), // Not Found
    409: Type.Object({ message: Type.String() }), // Conflict (wrong state)
    500: Type.Object({ message: Type.String() })  // Server Error
  }
};

// --- Schemas for POST /builds/:build_id/configure ---
// Request body schema for build refinement
export const ConfigureBuildBodySchema = Type.Object({
  feedback: Type.String({
    minLength: 1,
    description: 'User feedback on the sample results to refine the build configuration'
  }),
  hints: Type.Optional(Type.Array(Type.String(), {
    description: 'Optional hints or specific instructions to guide the refinement process'
  })),
  selectors: Type.Optional(Type.Record(Type.String(), Type.String(), {
    description: 'Optional specific selectors to use for different data points'
  })),
  include_fields: Type.Optional(Type.Array(Type.String(), {
    description: 'Optional list of fields to include in the results'
  })),
  exclude_fields: Type.Optional(Type.Array(Type.String(), {
    description: 'Optional list of fields to exclude from the results'
  }))
});

// Response schema for successful refinement initiation
export const ConfigureBuildResponseSchema = Type.Object({
  build_id: Type.String({ description: 'The unique ID of the build being refined' }),
  status: Type.Enum(BuildStatus, { description: 'The updated status of the build after refinement request' }),
  message: Type.String({ description: 'Refinement initiation success message' })
});

// Combined schema for the route definition
export const configureBuildSchema = {
  description: 'Submit feedback to refine a build configuration',
  tags: ['builds'],
  summary: 'Refine Build Configuration',
  params: BuildIdParamsSchema,
  body: ConfigureBuildBodySchema,
  response: {
    202: ConfigureBuildResponseSchema,
    400: Type.Object({ message: Type.String() }), // Bad Request
    404: Type.Object({ message: Type.String() }), // Not Found
    409: Type.Object({ message: Type.String() }), // Conflict (wrong state)
    500: Type.Object({ message: Type.String() })  // Server Error
  }
};

// TypeBox Static types for TypeScript inference
export type CreateBuildBody = Static<typeof CreateBuildBodySchema>;
export type BuildIdParams = Static<typeof BuildIdParamsSchema>;
export type ConfirmBuildResponse = Static<typeof ConfirmBuildResponseSchema>;
export type ConfigureBuildBody = Static<typeof ConfigureBuildBodySchema>;
export type ConfigureBuildResponse = Static<typeof ConfigureBuildResponseSchema>;
