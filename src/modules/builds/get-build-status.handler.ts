import { 
  FastifyPluginAsync, 
  FastifyRequest, 
  FastifyReply, 
  RouteGenericInterface, 
  FastifyInstance 
} from '../../types/fastify.js';
import { PrismaClient, Build, BuildStatus } from '../../generated/prisma/index.js';
import { BuildRepository } from '../../infrastructure/db/build.repository.js';
import { GetBuildStatusParams, GetBuildStatusParamsSchema, GetBuildStatusResponseSchema } from './get-build-status.schema.js';

const getBuildStatusRoute: FastifyPluginAsync = async (fastify: FastifyInstance, opts) => {
  fastify.get<{ Params: GetBuildStatusParams }>(
    '/:build_id',
    {
      schema: {
        params: GetBuildStatusParamsSchema,
        response: {
          200: GetBuildStatusResponseSchema,
        }
      }
    },
    async (request: FastifyRequest<{ Params: GetBuildStatusParams }>, reply: FastifyReply) => {
      const prisma: PrismaClient = fastify.prisma;
      const buildRepository = new BuildRepository(prisma);
      const { build_id } = request.params;

      if (!build_id) {
        return reply.badRequest('Build ID is required.');
      }

      try {
        const build: Build | null = await buildRepository.findBuildById(build_id);

        if (!build) {
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

        const response: any = {
          build_id: build.id,
          status: build.status,
          target_urls: parsedTargetUrls,
          error: build.error,
          created_at: build.createdAt,
          updated_at: build.updatedAt,
        };

        if (build.status === BuildStatus.PENDING_USER_FEEDBACK && build.sampleResultsJson) {
          try {
            if (typeof build.sampleResultsJson === 'string') {
              response.package_results = JSON.parse(build.sampleResultsJson);
            } else {
              response.package_results = build.sampleResultsJson;
            }
          } catch (e) {
            response.package_results = null;
            response.error = 'Sample results data corrupted.';
          }
        }
        return reply.code(200).send(response);
      } catch (error) {
        fastify.log.error(`Error fetching build status for ID ${build_id}:`, error);
        return reply.internalServerError('An unexpected error occurred while fetching build status.');
      }
    }
  );
};

export default getBuildStatusRoute;
