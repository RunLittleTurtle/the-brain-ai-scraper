import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../../generated/prisma/index.js';
import { BuildRepository } from '../../infrastructure/db/build.repository.js';
import { BuildStatus } from '../../generated/prisma/index.js';
import { GetBuildStatusParams } from './get-build-status.schema.js';

export async function getBuildStatusHandler(
  request: FastifyRequest<{ Params: GetBuildStatusParams }>,
  reply: FastifyReply
) {
  const prisma: PrismaClient = request.server.prisma;
  const buildRepository = new BuildRepository(prisma);
  const buildId = request.params.build_id;

  if (!buildId) {
    return reply.badRequest('Missing build_id in request path.');
  }

  try {
    const build = await buildRepository.findBuildById(buildId);
    if (!build) {
      return reply.notFound('Build not found.');
    }

    const response: any = {
      build_id: build.id,
      status: build.status,
      error: build.error || undefined,
      created_at: build.createdAt,
      updated_at: build.updatedAt,
    };

    // Only include package_results if status is PENDING_USER_FEEDBACK and results exist
    if (build.status === BuildStatus.PENDING_USER_FEEDBACK && build.sampleResultsJson) {
      try {
        response.package_results = JSON.parse(build.sampleResultsJson);
      } catch (e) {
        response.package_results = null;
        response.error = 'Sample results data corrupted.';
      }
    }
    return reply.code(200).send(response);
  } catch (error) {
    request.log.error('Error fetching build status:', error);
    return reply.internalServerError('Failed to fetch build status.');
  }
}
