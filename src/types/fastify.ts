/**
 * Extended Fastify type definitions
 * 
 * This file contains type extensions for the Fastify instance with our custom services
 */

import { FastifyInstance as BaseFastifyInstance, FastifyRequest as BaseRequest, FastifyReply as BaseReply } from 'fastify';
import { PrismaClient } from '../generated/prisma/index.js';
import { McpService } from '../mcp-server/mcp.service.js';
import { BuildRepository } from '../infrastructure/db/build.repository.js';
import { ToolboxService } from '../infrastructure/toolbox/toolbox.service.js';
import { ExecutionEngineService } from '../infrastructure/execution/execution.service.js';
import { FullScrapeExecutionService } from '../infrastructure/execution/full-scrape.service.js';

/**
 * Extended FastifyInstance type that includes all our decorated services
 */
export interface FastifyInstance extends BaseFastifyInstance {
  // Database client
  prisma: PrismaClient;
  
  // Config
  config: {
    apiKey: string;
  };
  
  // Services
  mcpService: McpService;
  buildRepository: BuildRepository;
  toolboxService: ToolboxService;
  executionEngine: ExecutionEngineService;
  fullScrapeService: FullScrapeExecutionService;
}

/**
 * FastifyRequest with our custom types
 */
export type FastifyRequest = BaseRequest;

/**
 * FastifyReply with our custom types
 */
export type FastifyReply = BaseReply;
