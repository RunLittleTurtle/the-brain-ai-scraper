import { Static, Type } from '@sinclair/typebox';
import { BuildStatus } from '../../generated/prisma/index.js';
import type { RouteGenericInterface } from '../../types/fastify.js';

export const GetBuildStatusParamsSchema = Type.Object({
  build_id: Type.String({ description: 'The unique ID assigned to the build.', format: 'uuid' })
});

export const GetBuildStatusResponseSchema = Type.Object({
  build_id: Type.String(),
  status: Type.Enum(BuildStatus),
  error: Type.Optional(Type.String()),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' }),
  package_results: Type.Optional(Type.Any()),
});

export const getBuildStatusSchema = {
  description: 'Get the status and sample results of a build.',
  tags: ['builds'],
  summary: 'Get Build Status',
  params: GetBuildStatusParamsSchema,
  response: {
    200: GetBuildStatusResponseSchema,
    400: Type.Object({ message: Type.String() }),
    401: Type.Object({ message: Type.String() }),
    404: Type.Object({ message: Type.String() }),
    500: Type.Object({ message: Type.String() })
  }
};

type ParamsType = Static<typeof GetBuildStatusParamsSchema>;

export interface GetBuildStatusParams extends RouteGenericInterface {
  Params: ParamsType;
  // Add Querystring, Body, Headers if needed for this route
}
