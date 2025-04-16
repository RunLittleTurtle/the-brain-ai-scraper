import { 
  FastifyPluginAsync, 
  FastifyInstance as BaseFastifyInstance 
} from 'fastify';
import type { 
  FastifyRequest, 
  FastifyReply, 
  RouteGenericInterface 
} from '../../types/fastify.js';
import { PrismaClient, Build, BuildStatus } from '../../generated/prisma/index.js';
import { BuildRepository } from '../../infrastructure/db/build.repository.js';
import { GetBuildStatusParams, GetBuildStatusParamsSchema, GetBuildStatusResponseSchema } from './get-build-status.schema.js';

const getBuildStatusRoute: FastifyPluginAsync = async (fastify: BaseFastifyInstance, opts) => {
  fastify.get<GetBuildStatusParams>(
    '/:build_id',
    {
      schema: {
        params: GetBuildStatusParamsSchema,
        response: {
          200: GetBuildStatusResponseSchema,
        }
      }
    },
    async (request: FastifyRequest<GetBuildStatusParams>, reply: FastifyReply) => {
      fastify.log.info({ msg: 'Entering GET /builds/:build_id handler', build_id: request.params?.build_id, headers: request.headers });

      try { 
        const { build_id } = request.params;
        fastify.log.info('Handler called for GET /builds/:build_id', { build_id });
        if (!build_id || typeof build_id !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(build_id)) {
          fastify.log.warn('Validation failed for build_id', { build_id });
          return reply.badRequest().send({ message: 'Build ID is required and must be a valid UUID.' });
        }
        fastify.log.info('Validation passed for build_id', { build_id });
        const prisma: PrismaClient = fastify.prisma;
        const buildRepository = new BuildRepository(prisma);
        try {
          fastify.log.info('Calling findBuildById', { build_id });
          const build: Build | null = await buildRepository.findBuildById(build_id);

          if (!build) {
            return reply.notFound().send({ message: `Build with ID ${build_id} not found.` });
          }

          let parsedTargetUrls: string[] = [];
          try {
            if (build.targetUrls) {
              parsedTargetUrls = JSON.parse(build.targetUrls);
            }
          } catch (parseError) {
            fastify.log.error(`Error parsing targetUrls for build ${build_id}:`, parseError);
            return reply.internalServerError().send({ message: 'Failed to parse build data.' }); 
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
        } catch (dbError) { 
          fastify.log.error(`Error during database operation for build ID ${build_id}:`, dbError);
          return reply.internalServerError().send({ message: 'An unexpected error occurred while fetching build status.' });
        }
      } catch (handlerError) { 
        fastify.log.error({ msg: 'Error inside GET /builds/:build_id handler', error: handlerError, stack: (handlerError as Error)?.stack, build_id: request.params?.build_id });
        if (handlerError instanceof Error && handlerError.message.includes('not found')) { 
          return reply.notFound().send({ message: handlerError.message });
        } else if (handlerError instanceof Error && handlerError.message.includes('Validation failed')) { 
           return reply.badRequest().send({ message: handlerError.message });
        }
        return reply.internalServerError().send({ message: 'An unexpected error occurred processing the request.' });
      } 
    } 
  ); 
}; 

export default getBuildStatusRoute;
