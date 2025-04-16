// src/types/fastify.d.ts

// Import base types directly
import type { FastifyInstance as BaseFastifyInstance } from 'fastify/types/instance.js';
import type { FastifyPluginOptions as BaseFastifyPluginOptions, FastifyPluginAsync as BaseFastifyPluginAsync } from 'fastify/types/plugin.js';
import type { FastifyRequest as BaseFastifyRequest, RequestGenericInterface as BaseRequestGenericInterface } from 'fastify/types/request.js';
import type { FastifyReply as BaseFastifyReply } from 'fastify/types/reply.js';
import type { FastifySchema as BaseFastifySchema} from 'fastify/types/schema.js';
import type { FastifyBaseLogger as BaseFastifyBaseLogger } from 'fastify/types/logger.js';
import type { FastifyTypeProviderDefault as BaseFastifyTypeProviderDefault } from 'fastify/types/type-provider.js';
import type { RawServerDefault } from 'fastify/types/utils.js';
import type { IncomingMessage, ServerResponse } from 'http';

// Import augmentations we need
import '@fastify/sensible'; // Re-add this import for global type augmentation
import { McpService } from '../mcp-server/mcp.service.js'; // Import the type for augmentation

// Re-export base types using their original names
export type FastifyPluginOptions = BaseFastifyPluginOptions;
// Use Fastify's new RequestGenericInterface for generics
export type FastifyRequest<T extends RouteGenericInterface = BaseRequestGenericInterface> = BaseFastifyRequest<T>;
export type FastifyReply = BaseFastifyReply;
export type FastifySchema = BaseFastifySchema;
export type FastifyBaseLogger = BaseFastifyBaseLogger;
export type FastifyTypeProviderDefault = BaseFastifyTypeProviderDefault;
// RouteGenericInterface removed in Fastify v4+. Use RequestGenericInterface instead.
export type RouteGenericInterface = BaseRequestGenericInterface;

// Re-export augmented FastifyInstance
export interface FastifyInstance extends BaseFastifyInstance {
  mcpService: McpService; // Add our custom property
  // Sensible properties like .sensible are added via global augmentation by importing '@fastify/sensible'
}

// Re-export augmented FastifyPluginAsync
// Note: Adjust generics if needed based on BaseFastifyPluginAsync definition
export type FastifyPluginAsync<Options extends FastifyPluginOptions = FastifyPluginOptions> = BaseFastifyPluginAsync<Options, RawServerDefault, BaseFastifyTypeProviderDefault>;
