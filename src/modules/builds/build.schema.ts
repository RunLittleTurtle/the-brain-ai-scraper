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

// --- Schemas for POST /builds/:id/confirm (Example) ---
// Define body/response schemas for POST confirm...
// export const confirmBuildSchema = { params: BuildIdParamsSchema, body: ..., response: { 200: ..., 404: ... } };

// TypeBox Static types for TypeScript inference
export type CreateBuildBody = Static<typeof CreateBuildBodySchema>;
