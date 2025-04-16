import { Static, Type } from '@sinclair/typebox';
import { PrismaClient, BuildStatus, Prisma, Build } from '../../generated/prisma/index.js'; 
import { BuildRepository } from '../../infrastructure/db/build.repository.js'; 
import type {
    FastifyPluginAsync,
    FastifyRequest,
    FastifyReply,
    FastifyInstance, 
    FastifyPluginOptions 
} from '../../types/fastify.js'; 

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

// --- Controller Plugin --- //

const buildsController: FastifyPluginAsync = async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {

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

    // Default handler for unhandled methods on /builds
    fastify.route({
        method: ['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        url: '/',
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            reply.methodNotAllowed();
        }
    });
};

export default buildsController;
