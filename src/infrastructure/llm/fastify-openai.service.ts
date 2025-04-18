import OpenAI from 'openai';
import { UniversalConfigurationPackageFormatV1 } from '../../core/domain/configuration-package.types.js';
import { ToolboxService } from '../toolbox/toolbox.service.js';
import { ITool } from '../execution/tool.interface.js';
import { FastifyLoggerInstance } from 'fastify';

// Import the actual NestJS types for compatibility
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

// This is the actual OpenaiService that we're going to use
import { OpenaiService } from './openai.service.js';

/**
 * Factory function to create a NestJS-compatible OpenaiService instance
 * that can be used with Fastify
 */
export function createOpenaiService(logger: FastifyLoggerInstance, toolboxService: ToolboxService): OpenaiService {
  // Create a NestJS-compatible ConfigService
  const configService = new ConfigService();
  
  // Create a NestJS-compatible Logger that uses Fastify's logger
  const nestLogger = new Logger('OpenaiService');
  
  // Override the Logger's log methods to use Fastify's logger
  (nestLogger as any).log = (message: string) => logger.info(message);
  (nestLogger as any).error = (message: string, trace?: string) => logger.error(message, trace);
  (nestLogger as any).warn = (message: string) => logger.warn(message);
  (nestLogger as any).debug = (message: string) => logger.debug(message);
  (nestLogger as any).verbose = (message: string) => logger.trace(message);
  
  // Create the OpenaiService with the NestJS dependencies
  const openaiService = new OpenaiService(configService, toolboxService);
  
  // Replace the internal Logger with our Fastify-logger-backed one
  (openaiService as any).logger = nestLogger;
  
  return openaiService;
}


