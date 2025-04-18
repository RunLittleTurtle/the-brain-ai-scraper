import { Static, Type } from '@sinclair/typebox';
import { PrismaClient, BuildStatus, Prisma, Build } from '../../generated/prisma/index.js'; 
import { BuildRepository } from '../../infrastructure/db/build.repository.js'; 
import { BuildIdParams, confirmBuildSchema, ConfirmBuildResponse, configureBuildSchema, ConfigureBuildBody, ConfigureBuildResponse } from './build.schema.js';
import type {
    FastifyPluginAsync,
    FastifyRequest,
    FastifyReply,
    FastifyInstance as CustomFastifyInstance, 
    FastifyPluginOptions 
} from '../../types/fastify.js'; 
import type { FastifyInstance as BaseFastifyInstance } from 'fastify';

// --- Schemas --- //

const CreateBuildBodySchema = Type.Object({
    target_urls: Type.Array(Type.String({ format: 'uri' }), { minItems: 1, description: 'List of target URLs to process' }),
    user_objective: Type.String({ minLength: 1, description: 'The user\'s objective for this build.' })
});
type CreateBuildBody = Static<typeof CreateBuildBodySchema>;

const CreateBuildResponseSchema = Type.Object({
    build_id: Type.String({ format: 'uuid', description: 'The unique ID of the created build job' }),
    message: Type.String()
});

const GetBuildStatusParamsSchema = Type.Object({
  build_id: Type.String({ 
    format: 'uuid', 
    description: 'The unique identifier for the build job.' 
  })
});

type GetBuildStatusParams = Static<typeof GetBuildStatusParamsSchema>;

const GetBuildStatusResponseSchema = Type.Object({
    build_id: Type.String({ format: 'uuid' }),
    status: Type.Enum(BuildStatus),
    target_urls: Type.Array(Type.String({ format: 'uri' })),
    error: Type.Optional(Type.String()),
    package_results: Type.Optional(Type.Any()), 
    created_at: Type.Unsafe<Date>(Type.String({ format: 'date-time' })), 
    updated_at: Type.Unsafe<Date>(Type.String({ format: 'date-time' }))  
});

// --- Route Type Interface --- //

interface CreateBuildRoute {
    Body: CreateBuildBody;
    Reply: Static<typeof CreateBuildResponseSchema>;
}

interface GetBuildStatusRoute {
    Params: GetBuildStatusParams;
    Reply: Static<typeof GetBuildStatusResponseSchema>; 
}

interface ConfirmBuildRoute {
    Params: BuildIdParams;
    Reply: ConfirmBuildResponse;
}

interface ConfigureBuildRoute {
    Params: BuildIdParams;
    Body: ConfigureBuildBody;
    Reply: ConfigureBuildResponse;
}

// --- Controller Plugin --- //

// Use base FastifyInstance for plugin signature; cast to CustomFastifyInstance if/when mcpService is needed
const buildsController: FastifyPluginAsync = async (fastify: BaseFastifyInstance, opts: FastifyPluginOptions) => {

    // POST /builds - Create a new build job
    fastify.post<CreateBuildRoute>(
        '/',
        {
            schema: { 
                body: CreateBuildBodySchema,
                response: {
                    201: CreateBuildResponseSchema,
                    400: Type.Object({ message: Type.String() }),
                    500: Type.Object({ message: Type.String() })
                }
            }
        },
        async (request: FastifyRequest<CreateBuildRoute>, reply: FastifyReply) => {
            const prisma: PrismaClient = fastify.prisma;
            const { target_urls, user_objective } = request.body;

            if (!Array.isArray(target_urls) || target_urls.length === 0) {
                return reply.badRequest('target_urls must be a non-empty array.');
            }

            try {
                const targetUrlsJson = JSON.stringify(target_urls);

                const buildData: Prisma.BuildCreateInput = {
                    targetUrls: targetUrlsJson,
                    userObjective: user_objective,
                    status: BuildStatus.PENDING_ANALYSIS, 
                };

                const newBuild = await prisma.build.create({ data: buildData });

                fastify.log.info(`Build job ${newBuild.id} created. Triggering analysis...`);

                return reply.status(201).send({
                    build_id: newBuild.id,
                    message: 'Build job created successfully and analysis initiated.',
                });

            } catch (error: any) {
                fastify.log.error('Error creating build job:', error);
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                     fastify.log.warn(`Prisma Error creating build: ${error.code}`);
                     return reply.internalServerError('Database error occurred while creating build job.');
                } else if (error instanceof SyntaxError && error.message.includes('JSON')) {
                     return reply.internalServerError('Internal error processing URLs.');
                }
                return reply.internalServerError('An unexpected error occurred while creating the build job.');
            }
        }
    );

    // GET /builds/:build_id - Get build status by ID
    fastify.get<GetBuildStatusRoute>( 
        '/:build_id',
        {
            schema: {
                params: GetBuildStatusParamsSchema,
                response: {
                    200: GetBuildStatusResponseSchema,
                    400: Type.Object({ message: Type.String() }), 
                    404: Type.Object({ message: Type.String() }), 
                    500: Type.Object({ message: Type.String() })  
                }
            }
        },
        async (request: FastifyRequest<GetBuildStatusRoute>, reply: FastifyReply) => {
            fastify.log.info({ msg: 'Entering GET /builds/:build_id controller', build_id: request.params?.build_id, headers: request.headers });

            try {
                const { build_id } = request.params;

                fastify.log.info('Validation passed for build_id (implicit via schema)', { build_id });

                const prisma: PrismaClient = fastify.prisma;
                const buildRepository = new BuildRepository(prisma);

                try {
                    fastify.log.info('Calling findBuildById from controller', { build_id });
                    const build: Build | null = await buildRepository.findBuildById(build_id);

                    if (!build) {
                        fastify.log.warn(`Build with ID ${build_id} not found.`);
                        return reply.notFound(`Build with ID ${build_id} not found.`); 
                    }

                    let parsedTargetUrls: string[] = [];
                    try {
                        if (build.targetUrls) {
                            parsedTargetUrls = JSON.parse(build.targetUrls);
                        }
                    } catch (parseError) {
                        fastify.log.error(`Error parsing targetUrls for build ${build_id}:`, parseError);
                        return reply.internalServerError('Failed to parse build data.'); 
                    }

                    const response: Static<typeof GetBuildStatusResponseSchema> = {
                        build_id: build.id,
                        status: build.status,
                        target_urls: parsedTargetUrls,
                        error: build.error ?? undefined, 
                        created_at: build.createdAt,
                        updated_at: build.updatedAt,
                    };

                    if (build.status === BuildStatus.PENDING_USER_FEEDBACK && build.sampleResultsJson) {
                        try {
                            response.package_results = typeof build.sampleResultsJson === 'string'
                                ? JSON.parse(build.sampleResultsJson)
                                : build.sampleResultsJson; 
                        } catch (e) {
                            fastify.log.error(`Error parsing sampleResultsJson for build ${build_id}:`, e);
                            response.package_results = null; 
                            response.error = response.error ? `${response.error}; Sample results data corrupted.` : 'Sample results data corrupted.';
                        }
                    }

                    return reply.code(200).send(response);

                } catch (dbError) {
                    fastify.log.error(`Error during database operation for build ID ${build_id}:`, dbError);
                    return reply.internalServerError('An unexpected error occurred while fetching build status.');
                }
            } catch (handlerError) {
                fastify.log.error({ msg: 'Unexpected Error in GET /builds/:build_id controller', error: handlerError, stack: (handlerError as Error)?.stack, build_id: request.params?.build_id });
                return reply.internalServerError('An unexpected error occurred processing the request.'); 
            }
        }
    );

    // POST /builds/:build_id/confirm - Confirm a build configuration
    fastify.post<ConfirmBuildRoute>(
        '/:build_id/confirm',
        {
            schema: confirmBuildSchema
        },
        async (request: FastifyRequest<ConfirmBuildRoute>, reply: FastifyReply) => {
            const { build_id } = request.params;
            fastify.log.info({ msg: 'Processing build confirmation request', build_id });
            
            try {
                const prisma: PrismaClient = fastify.prisma;
                const buildRepository = new BuildRepository(prisma);
                
                // 1. Find the build and check if it exists
                const build = await buildRepository.findBuildById(build_id);
                if (!build) {
                    fastify.log.warn(`Build with ID ${build_id} not found.`);
                    return reply.notFound(`Build with ID ${build_id} not found.`);
                }
                
                // 2. Validate that the build is in a confirmable state
                if (build.status !== BuildStatus.PENDING_USER_FEEDBACK) {
                    fastify.log.warn(`Cannot confirm build ${build_id} - invalid status: ${build.status}`);
                    return reply.status(409).send({
                        message: `Cannot confirm build in ${build.status} state. Build must be in ${BuildStatus.PENDING_USER_FEEDBACK} state.`
                    });
                }
                
                // 3. Verify that we have sample results and initial configuration package
                if (!build.sampleResultsJson || !build.initialPackageJson) {
                    fastify.log.error(`Build ${build_id} is missing required data for confirmation.`);
                    return reply.status(500).send({
                        message: 'Build is missing required data for confirmation (sample results or configuration).'
                    });
                }
                
                // 4. Update the build status to confirmed and save the configuration
                try {
                    const updatedBuild = await prisma.build.update({
                        where: { id: build_id },
                        data: {
                            status: BuildStatus.CONFIRMED,
                            finalConfigurationJson: build.initialPackageJson,
                            updatedAt: new Date()
                        }
                    });
                    
                    fastify.log.info(`Build ${build_id} successfully confirmed.`);
                    
                    return reply.status(200).send({
                        build_id: updatedBuild.id,
                        status: updatedBuild.status,
                        message: 'Build configuration successfully confirmed.'
                    });
                    
                } catch (updateError) {
                    fastify.log.error(`Error updating build ${build_id} status:`, updateError);
                    return reply.internalServerError('Failed to update build status.');
                }
                
            } catch (error) {
                fastify.log.error(`Unexpected error during build confirmation:`, error);
                return reply.internalServerError('An unexpected error occurred while processing the confirmation.');
            }
        }
    );

    // Default handler for unhandled methods on /builds root path
    fastify.route({
        method: ['PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        url: '/',
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            reply.methodNotAllowed();
        }
    });
    
    // Handle GET on root path - should return 405 Method Not Allowed for consistency
    fastify.get('/', {
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            reply.methodNotAllowed();
        }
    });
    
    // POST /builds/:build_id/configure - Submit feedback to refine a build configuration
    fastify.post<ConfigureBuildRoute>(
        '/:build_id/configure',
        {
            schema: configureBuildSchema
        },
        async (request: FastifyRequest<ConfigureBuildRoute>, reply: FastifyReply) => {
            const { build_id } = request.params;
            const { user_feedback, tool_hints } = request.body;
            
            fastify.log.info({ msg: 'Processing build refinement request', build_id });
            
            try {
                const prisma: PrismaClient = fastify.prisma;
                const buildRepository = new BuildRepository(prisma);
                
                // 1. Find the build and check if it exists
                const build = await buildRepository.findBuildById(build_id);
                if (!build) {
                    fastify.log.warn(`Build with ID ${build_id} not found.`);
                    return reply.notFound(`Build with ID ${build_id} not found.`);
                }
                
                // 2. Validate that the build is in a refinable state
                // Only builds in PENDING_USER_FEEDBACK state can be refined
                if (build.status !== BuildStatus.PENDING_USER_FEEDBACK) {
                    fastify.log.warn(`Cannot refine build ${build_id} - invalid status: ${build.status}`);
                    return reply.status(409).send({
                        message: `Cannot refine build in ${build.status} state. Build must be in ${BuildStatus.PENDING_USER_FEEDBACK} state.`
                    });
                }
                
                // 3. Check required data for refinement
                if (!build.initialPackageJson || !build.sampleResultsJson) {
                    fastify.log.error(`Build ${build_id} is missing required data for refinement.`);
                    return reply.status(400).send({
                        message: 'Build is missing required data for refinement (initial package or sample results).'
                    });
                }
                
                // 4. Store user feedback for later use
                try {
                    // Parse the original package and sample results if they're stored as strings
                    let initialPackage;
                    let sampleResults;
                    try {
                        initialPackage = typeof build.initialPackageJson === 'string' 
                            ? JSON.parse(build.initialPackageJson) 
                            : build.initialPackageJson;
                            
                        sampleResults = typeof build.sampleResultsJson === 'string'
                            ? JSON.parse(build.sampleResultsJson)
                            : build.sampleResultsJson;
                    } catch (parseError) {
                        fastify.log.error(`Error parsing stored data for build ${build_id}:`, parseError);
                        return reply.internalServerError('Failed to parse build configuration data.');
                    }
                    
                    // Store user feedback JSON in the userFeedbackJson field
                    const userFeedbackData = {
                        feedback: user_feedback,
                        tool_hints: tool_hints || [],
                        timestamp: new Date().toISOString()
                    };
                    
                    // Update build status to PROCESSING_FEEDBACK and store user feedback
                    const updatedBuild = await prisma.build.update({
                        where: { id: build_id },
                        data: {
                            status: BuildStatus.PROCESSING_FEEDBACK,
                            userFeedbackJson: JSON.stringify(userFeedbackData),
                            updatedAt: new Date()
                        }
                    });
                    
                    // 5. Trigger the refinement process via queue
                    // This will be processed asynchronously by the build processor
                    // For now, we can just return success; the build processor will handle the actual refinement
                    
                    fastify.log.info(`Build ${build_id} refinement initiated successfully.`);
                    
                    // 6. Return success response
                    return reply.status(202).send({
                        build_id: updatedBuild.id,
                        status: updatedBuild.status,
                        message: 'Build refinement initiated successfully. Check status endpoint for updates.'
                    });
                    
                } catch (updateError) {
                    fastify.log.error(`Error updating build ${build_id} status:`, updateError);
                    return reply.internalServerError('Failed to update build status.');
                }
                
            } catch (error) {
                fastify.log.error(`Unexpected error during build refinement:`, error);
                return reply.internalServerError('An unexpected error occurred while processing the refinement request.');
            }
        }
    );

    // Handle missing build_id in paths like /builds/ with trailing slash
    fastify.route({
        method: ['GET', 'PUT', 'DELETE', 'PATCH', 'POST', 'HEAD', 'OPTIONS'],
        url: '/*',
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            // If not caught by other routes, return Method Not Allowed
            reply.methodNotAllowed();
        }
    });
};

export default buildsController;
