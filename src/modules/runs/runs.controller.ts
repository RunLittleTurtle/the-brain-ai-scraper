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

type CreateRunRoute = {
  Body: CreateRunBody;
  Reply: Static<typeof CreateRunResponseSchema>;
};

// --- Controller Plugin --- //
const runsController: FastifyPluginAsync = async (fastify: BaseFastifyInstance, opts: FastifyPluginOptions) => {
  fastify.post<{ Body: CreateRunBody; Reply: CreateRunRoute['Reply'] }>('/runs', {
    schema: {
      body: CreateRunBodySchema,
      response: {
        200: CreateRunResponseSchema
      }
    }
  }, async (request, reply) => {
    // Placeholder for future implementation
    // TODO: Implement run execution logic, auth, build state checks, orchestration, etc.
    return reply.status(200).send({
      run_id: '00000000-0000-0000-0000-000000000000', // TODO: Replace with generated run_id
      message: 'Run execution initiated (stub).'
    });
  });
};

export default runsController;
