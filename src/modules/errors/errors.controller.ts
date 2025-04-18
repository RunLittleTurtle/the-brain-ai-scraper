/**
 * Error Reporting Controller
 * 
 * Provides API endpoints for retrieving detailed error information for builds
 */

import { FastifyPluginAsync } from 'fastify';
import { FastifyInstance, FastifyRequest, FastifyReply } from '../../types/fastify.js';
import { Type } from '@sinclair/typebox';
import { BuildStatus } from '../../generated/prisma/index.js';
import { errorReportingService } from '../../core/services/error-reporting.service.js';
import { ErrorCategory, ErrorSeverity } from '../../core/domain/error-reporting.types.js';

// Define request/response schemas for type safety and validation
const errorParamsSchema = Type.Object({
  build_id: Type.String({ minLength: 5 })
});

// Simplified/sanitized error response schema
const errorResponseSchema = Type.Object({
  build_id: Type.String(),
  error: Type.Optional(Type.String()),
  error_details: Type.Optional(Type.Object({
    message: Type.String(),
    category: Type.String(),
    severity: Type.String(),
    timestamp: Type.String(),
    code: Type.Optional(Type.String()),
    type: Type.Optional(Type.String()),
    context: Type.Optional(Type.Record(Type.String(), Type.Any())),
    troubleshooting: Type.Optional(Type.Array(Type.String())),
    workarounds: Type.Optional(Type.Array(Type.String()))
  })),
  status: Type.Enum(BuildStatus)
});

// Controller that handles all error-related routes
const errorsController: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Register routes
  
  /**
   * Get detailed error information for a build
   */
  fastify.get<{ Params: { build_id: string } }>(
    '/builds/:build_id/errors',
    {
      schema: {
        params: errorParamsSchema,
        response: {
          200: errorResponseSchema,
          404: Type.Object({
            message: Type.String(),
            statusCode: Type.Number({ default: 404 })
          }),
          500: Type.Object({
            message: Type.String(),
            statusCode: Type.Number({ default: 500 })
          })
        }
      }
    },
    async (request, reply) => {
      const { build_id } = request.params;
      
      try {
        // Get build from repository
        const build = await fastify.prisma.build.findUnique({
          where: { id: build_id }
        });
        
        if (!build) {
          return reply.notFound(`Build with ID '${build_id}' not found`);
        }
        
        // Only return error details if the build has an error or is in a failed state
        const hasError = build.error || build.errorDetailsJson || 
          (build.status === BuildStatus.FAILED || build.status === BuildStatus.ANALYSIS_FAILED);
        
        if (!hasError) {
          return reply.send({
            build_id: build.id,
            status: build.status,
            message: 'No errors reported for this build'
          });
        }
        
        // Parse the error details or create a basic one from the simple error field
        let errorDetails;
        if (build.errorDetailsJson) {
          // Use the detailed error information if available
          errorDetails = build.errorDetailsJson;
        } else if (build.error) {
          // Create basic error details from the legacy error field
          errorDetails = errorReportingService.createErrorDetails(
            new Error(build.error),
            ErrorCategory.UNKNOWN,
            ErrorSeverity.ERROR,
            { buildId: build.id }
          );
        }
        
        // Sanitize the error details for API response
        const sanitizedDetails = errorDetails ? 
          errorReportingService.sanitizeForApiResponse(errorDetails as any) : 
          null;
        
        // Return the error information
        return reply.send({
          build_id: build.id,
          error: build.error,
          error_details: sanitizedDetails,
          status: build.status
        });
      } catch (error) {
        fastify.log.error(`Error fetching error details for build ${build_id}: ${error}`);
        
        return reply.internalServerError('Failed to retrieve error information');
      }
    }
  );
  
  /**
   * Get a list of builds with errors
   */
  fastify.get(
    '/builds/errors',
    {
      schema: {
        querystring: Type.Object({
          limit: Type.Optional(Type.Number({ default: 10, minimum: 1, maximum: 100 })),
          offset: Type.Optional(Type.Number({ default: 0, minimum: 0 })),
          category: Type.Optional(Type.String())
        }),
        response: {
          200: Type.Object({
            items: Type.Array(Type.Object({
              build_id: Type.String(),
              status: Type.Enum(BuildStatus),
              error: Type.Optional(Type.String()),
              timestamp: Type.String(),
              category: Type.Optional(Type.String())
            })),
            total: Type.Number(),
            limit: Type.Number(),
            offset: Type.Number()
          })
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { limit = 10, offset = 0, category } = request.query as any;
      
      try {
        // Find builds with errors
        let whereCondition: any = {
          OR: [
            { error: { not: null } },
            { errorDetailsJson: { not: null } },
            { status: { in: [BuildStatus.FAILED, BuildStatus.ANALYSIS_FAILED] } }
          ]
        };
        
        // Filter by category if provided
        if (category) {
          whereCondition = {
            AND: [
              whereCondition,
              {
                errorDetailsJson: {
                  path: ['category'],
                  equals: category
                }
              }
            ]
          };
        }
        
        // Count total matching records
        const total = await fastify.prisma.build.count({
          where: whereCondition
        });
        
        // Get paginated results
        const builds = await fastify.prisma.build.findMany({
          where: whereCondition,
          orderBy: {
            updatedAt: 'desc'
          },
          take: limit,
          skip: offset
        });
        
        // Map to response format
        const items = builds.map((build: any) => {
          // Extract category from error details if available
          let category = null;
          if (build.errorDetailsJson && typeof build.errorDetailsJson === 'object') {
            category = (build.errorDetailsJson as any).category || null;
          }
          
          return {
            build_id: build.id,
            status: build.status,
            error: build.error || null,
            timestamp: build.updatedAt.toISOString(),
            category
          };
        });
        
        return reply.send({
          items,
          total,
          limit,
          offset
        });
      } catch (error) {
        fastify.log.error(`Error fetching builds with errors: ${error}`);
        
        return reply.internalServerError('Failed to retrieve builds with errors');
      }
    }
  );
};

export default errorsController;
