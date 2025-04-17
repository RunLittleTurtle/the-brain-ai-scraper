import { Static, Type } from '@sinclair/typebox';
import type {
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
  FastifyPluginOptions
} from '../../types/fastify.js';
import type { FastifyInstance as BaseFastifyInstance } from 'fastify';

// --- Schemas --- //
const CreateRunBodySchema = Type.Object({
  build_id: Type.String({ format: 'uuid', description: 'The build ID for which to execute a run.' }),
  target_urls: Type.Array(Type.String({ format: 'uri' }), { minItems: 1, description: 'List of target URLs for this run.' })
});
type CreateRunBody = Static<typeof CreateRunBodySchema>;

const CreateRunResponseSchema = Type.Object({
  run_id: Type.String({ format: 'uuid', description: 'The unique ID of the created run job' }),
  message: Type.String()
});

// Define a consistent base error schema
const BaseErrorResponseSchema = Type.Object({
  run_id: Type.Optional(Type.String()), // Keep optional as it might not exist yet
  message: Type.String(),
  errors: Type.Optional(Type.Array(Type.Any())) // Make errors optional again to prevent serialization failures
});

// Define a union type for all possible replies
type RunRouteReply = Static<typeof CreateRunResponseSchema> | Static<typeof BaseErrorResponseSchema>;

// --- Controller Plugin --- //
import { PrismaClient } from '../../generated/prisma/index.js';
import { BuildRepository } from '../../infrastructure/db/build.repository.js';
import { RunRepository } from '../../infrastructure/db/run.repository.js';
import { ExecutionEngineService } from '../../infrastructure/execution/execution.service.js';
import { ToolboxService } from '../../infrastructure/toolbox/toolbox.service.js';
import { UniversalConfigurationPackageFormatV1 } from '../../core/domain/configuration-package.types.js';
import { RunStatus } from '../../generated/prisma/index.js';

// --- Extend FastifyRequest to include user property (as per auth plugin) ---
interface FastifyUser {
  id: string;
  // Add other properties if your auth plugin decorates more
}

interface AuthenticatedRequest extends FastifyRequest {
  user?: FastifyUser;
}

const runsController: FastifyPluginAsync = async (fastify: BaseFastifyInstance, opts: FastifyPluginOptions) => {
  // Instantiate repositories (in production, use DI or Fastify decorators)
  const prisma = new PrismaClient();
  const buildRepository = new BuildRepository(prisma);
  const runRepository = new RunRepository(prisma);

  // Add a plugin-level error handler to ensure validation errors are properly formatted
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({ err: error }, 'Error in runs controller');
    
    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        run_id: '',
        message: 'Validation failed',
        errors: error.validation // Ensure validation errors are included
      });
    }

    // Forward to the global error handler for other errors
    return reply.send(error);
  });

  fastify.post<{ Body: CreateRunBody; Reply: RunRouteReply }>('', {
    schema: {
      body: CreateRunBodySchema,
      response: {
        200: CreateRunResponseSchema,
        // Use the base error schema for all error responses
        400: BaseErrorResponseSchema, // Add 400 response schema
        401: BaseErrorResponseSchema,
        403: BaseErrorResponseSchema,
        404: BaseErrorResponseSchema,
        500: BaseErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      // --- Auth check (assumes Fastify auth plugin decorates request with user info) ---
      const authRequest = request as AuthenticatedRequest;
      const userId = authRequest.user?.id || null;
      if (!userId) {
        return reply.status(401).type('application/json').send({ run_id: '', message: 'Unauthorized: Missing or invalid credentials.', errors: [] });
      }

      // --- Build existence and state check ---
      const { build_id, target_urls } = request.body;
      fastify.log.info(`[RUNS] Looking up build_id: ${build_id} for user: ${userId}`);
      const build = await buildRepository.findBuildById(build_id);
      if (!build) {
        fastify.log.error(`[RUNS] Build not found: ${build_id}`);
        return reply.status(404).type('application/json').send({ run_id: '', message: 'Build not found.', errors: [] });
      }
      fastify.log.info(`[RUNS] Build found: ${build_id} with status: ${build.status} and userId: ${build.userId}`);
      // Only allow runs for confirmed builds
      if (build.status !== 'CONFIRMED') {
        fastify.log.error(`[RUNS] Build not CONFIRMED: ${build.status}`);
        return reply.status(400).type('application/json').send({ run_id: '', message: `Build is not in CONFIRMED state. Current state: ${build.status}`, errors: [] });
      }
      // Optional: Only allow runs for the requesting user
      if (build.userId && build.userId !== userId) {
        fastify.log.error(`[RUNS] Forbidden: build.userId=${build.userId} request.userId=${userId}`);
        return reply.status(403).type('application/json').send({ run_id: '', message: 'Forbidden: You do not have access to this build.', errors: [] });
      }

      // --- Create run record ---
      const run = await runRepository.createRun({
        buildId: build_id,
        targetUrls: target_urls
      });

      // --- Trigger execution engine asynchronously ---
      (async () => {
        try {
          // 1. Fetch the build again (to get finalConfigurationJson)
          const buildForConfig = await buildRepository.findBuildById(build_id);
          if (!buildForConfig || !buildForConfig.finalConfigurationJson) {
            await runRepository.updateRunStatus(run.id, RunStatus.FAILED, 'Final configuration missing or build not found.');
            return;
          }
          // 2. Parse config
          let configPackage: UniversalConfigurationPackageFormatV1;
          try {
            configPackage = typeof buildForConfig.finalConfigurationJson === 'string'
              ? JSON.parse(buildForConfig.finalConfigurationJson)
              : buildForConfig.finalConfigurationJson;
          } catch (parseErr) {
            await runRepository.updateRunStatus(run.id, RunStatus.FAILED, 'Failed to parse final configuration: ' + (parseErr as Error).message);
            return;
          }

          // 3. Update run status to RUNNING
          await runRepository.updateRunStatus(run.id, RunStatus.RUNNING);

          // 4. Prepare toolbox & execution engine
          const toolboxService = new ToolboxService();
          // TODO: Register all required tools here if not already registered globally
          const executionEngine = new ExecutionEngineService(toolboxService, toolboxService);

          // 5. Execute
          const result = await executionEngine.executePackage(configPackage, target_urls);

          // 6. Store result
          await runRepository.updateRunStatus(
            run.id,
            result.overallStatus === 'completed' ? RunStatus.COMPLETED : RunStatus.FAILED,
            result.error || undefined
          );
          // Optionally, store resultJson if schema supports it
          if ('resultJson' in run) {
            // Update resultJson if supported by the model
            // Fix: Serialize the result to JSON to match Prisma InputJsonValue type
            await prisma.run.update({ where: { id: run.id }, data: { resultJson: JSON.parse(JSON.stringify(result)) } });
          }
        } catch (err: any) {
          await runRepository.updateRunStatus(run.id, RunStatus.FAILED, err?.message || 'Unknown execution error');
        }
      })();

      return reply.status(200).send({
        run_id: run.id,
        message: 'Run execution initiated.'
      });
    } catch (err: any) {
      fastify.log.error({ err }, 'Error handling POST /runs');
      return reply.status(500).type('application/json').send({ run_id: '', message: 'Internal server error.', errors: [] });
    }
  });
};

export default runsController;
