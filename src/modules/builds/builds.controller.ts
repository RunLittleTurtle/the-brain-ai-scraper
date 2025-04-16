import { Static, Type } from '@sinclair/typebox';
import { PrismaClient, BuildStatus, Prisma } from '../../generated/prisma/index.js'; 
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
    user_objective: Type.Optional(Type.String({ description: 'Optional user objective for the build' }))
});
type CreateBuildBody = Static<typeof CreateBuildBodySchema>;

const CreateBuildResponseSchema = Type.Object({
    build_id: Type.String({ format: 'uuid', description: 'The unique ID of the created build job' }),
    message: Type.String()
});

// --- Route Type Interface --- //
interface CreateBuildRoute {
    Body: CreateBuildBody;
    Reply: Static<typeof CreateBuildResponseSchema>;
}

// --- Controller Plugin --- //

const buildsController: FastifyPluginAsync = async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {

    // POST /builds - Create a new build job
    fastify.post<CreateBuildRoute>(
        '/',
        {
            schema: { 
                description: 'Initiates a new build job with the provided target URLs and objective.',
                tags: ['Builds'],
                summary: 'Create New Build Job',
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
                    userObjective: typeof user_objective === 'undefined' ? null : user_objective,
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
