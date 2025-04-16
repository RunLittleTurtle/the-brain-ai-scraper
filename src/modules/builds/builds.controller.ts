import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../../generated/prisma/index.js'; 
import { BuildRepository, CreateBuildData } from '../../infrastructure/db/build.repository.js'; 
import { processBuildJob } from '../../jobs/build.processor.js'; 
import { createBuildSchema, CreateBuildBody } from './build.schema.js'; 
import { apiKeyAuth } from '../../hooks/apiKeyAuth.js'; 

/**
 * Handles POST /builds requests
 */
async function createBuildHandler(request: FastifyRequest, reply: FastifyReply) {
    // Access Prisma client from the Fastify instance decorated by the plugin
    const prisma: PrismaClient = request.server.prisma;
    // Instantiate repository (could use DI in a larger app)
    const buildRepository = new BuildRepository(prisma);

    // Fastify types request.body based on the schema applied to the route
    // Explicit type assertion can be used if needed, but often inference is sufficient
    const { target_urls, user_objective } = request.body as CreateBuildBody;

    // Basic validation (schema validation is primary)
    if (!target_urls || target_urls.length === 0 || !user_objective) {
        // Schema validation should catch this, but good practice
        return reply.badRequest('Missing required fields: target_urls and user_objective');
    }

    try {
        const createData: CreateBuildData = {
            targetUrls: target_urls,
            userObjective: user_objective,
        };

        // Use repository to create the build record
        const newBuild = await buildRepository.createBuild(createData);

        // --- Trigger Background Job (Temporary direct async call) ---
        // IMPORTANT: Replace this with a proper job queue enqueue later!
        request.log.info(`[BuildsController] Triggering background job for build ${newBuild.id}`);
        // TODO: Provide the required 5 arguments for processBuildJob
        // For now, just call the job processor and handle errors
        try {
            // Example: processBuildJob('job-' + newBuild.id, newBuild.id, ...)
            // await processBuildJob('job-' + newBuild.id, newBuild.id, ...);
        } catch (err) {
            // Basic error handling for the async job trigger itself
            request.log.error(`Error triggering background job for build ${newBuild.id}:`, err);
            // Option 1: Update build status to FAILED immediately
            // Option 2: Log and rely on monitoring/retries (if queue exists)
            await buildRepository.updateBuildStatus(newBuild.id, 'FAILED', 'Failed to trigger processing job').catch(updateErr => {
                request.log.error(`Failed to update build status after job trigger error for ${newBuild.id}:`, updateErr);
            });
        }
        // --- End Temporary Trigger ---

        // Return 202 Accepted with the build ID
        return reply.code(202).send({
            message: "Build request accepted and processing started.",
            build_id: newBuild.id,
            status: newBuild.status // Initial status (e.g., PENDING_ANALYSIS)
        });

    } catch (error: any) {
        request.log.error('Error creating build in handler:', error);
        // Use sensible plugin's error handling for internal server errors
        return reply.internalServerError('Failed to initiate build process.');
    }
}

/**
 * Defines routes for the /builds endpoint
 */
import { getBuildStatusHandler } from './get-build-status.handler.js';
import { getBuildStatusSchema, GetBuildStatusParams } from './get-build-status.schema.js';

export default async function (fastify: FastifyInstance) {

    // Create a new build request
    fastify.post('/',
        {
            schema: createBuildSchema, // Apply schema validation
            preHandler: [apiKeyAuth] // Apply API key authentication
        },
        createBuildHandler
    );

    // Get build status and samples
    fastify.get<{ Params: GetBuildStatusParams }>('/:build_id', {
        schema: getBuildStatusSchema,
        preHandler: [apiKeyAuth],
    }, getBuildStatusHandler);

    // Handle unsupported methods on /builds route
    fastify.route({
        method: ['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'], 
        url: '/',
        preHandler: [apiKeyAuth], // Keep authentication for consistency
        handler: async (request, reply) => {
            return reply.methodNotAllowed(); // Use sensible's helper
        },
    });
}
