/**
 * Integration test for the Interactive Scrape module
 * 
 * This test verifies that the modularized controller structure
 * correctly handles API requests through the entire scraping workflow
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import interactiveScrapeModule from '../../../src/modules/scrapes/interactive-scrape.module.js';
import { PrismaClient } from '../../../src/generated/prisma/index.js';
import { BuildRepository } from '../../../src/infrastructure/db/build.repository.js';
import { AnalysisService } from '../../../src/modules/analysis/analysis.service.js';
import { FullScrapeExecutionService } from '../../../src/infrastructure/execution/full-scrape.service.js';

// Create a mock implementation of each service that would normally be registered
// with Fastify, just enough to test the route registration and basic flow
const mockPrisma = {
  build: {
    create: () => ({ id: 'test-job-id', status: 'PENDING_ANALYSIS' }),
    findUnique: () => ({ id: 'test-job-id', status: 'PENDING_ANALYSIS' }),
    update: () => ({ id: 'test-job-id' })
  }
} as unknown as PrismaClient;

const mockAnalysisService = {
  analyzeBuild: () => Promise.resolve(),
  generateSampleUrls: () => Promise.resolve(['https://example.com']),
  refineBuildConfiguration: () => Promise.resolve()
} as unknown as AnalysisService;

const mockExecutionService = {
  executeScrape: () => Promise.resolve(),
  getScrapeProgress: () => Promise.resolve({ total: 10, completed: 5, percentage: 50 }),
  getProgress: () => Promise.resolve({ 
    total_urls: 10, 
    processed_urls: 5, 
    percentage_complete: 50 
  })
} as unknown as FullScrapeExecutionService;

describe('Interactive Scrape Module - Integration Test', () => {
  let fastify: any;

  // Set up Fastify with our module
  beforeAll(async () => {
    fastify = Fastify();

    // Register the dependencies that the controllers need
    fastify.decorate('prisma', mockPrisma);
    fastify.decorate('analysisService', mockAnalysisService);
    fastify.decorate('executionService', mockExecutionService);

    // Register our interactive scrape module
    await fastify.register(interactiveScrapeModule);

    await fastify.ready();
  });

  // Clean up after tests
  afterAll(async () => {
    await fastify.close();
  });

  // Test that the module registers routes correctly
  it('should register scrape routes', () => {
    // Check that our main routes exist
    const routes = fastify.printRoutes();
    
    // Verify that all routes are correctly registered
    expect(routes).toContain('/api/v1/scrapes');
    expect(routes).toContain('/api/v1/scrapes/:job_id');
    expect(routes).toContain('/api/v1/scrapes/:job_id/proposal-feedback');
    expect(routes).toContain('/api/v1/scrapes/:job_id/sample-feedback');
    expect(routes).toContain('/api/v1/scrapes/:job_id/results');
  });

  // Test the create scrape route
  it('should handle create scrape request', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/scrapes',
      payload: {
        target_urls: ['https://example.com'],
        user_objective: 'Extract product information'
      }
    });

    expect(response.statusCode).toBe(202);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('job_id');
    expect(payload.status).toBe('pending');
  });

  // Test the status route
  it('should handle get status request', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/scrapes/test-job-id'
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('job_id');
    expect(payload).toHaveProperty('status');
  });

  // More tests can be added for each step in the workflow
  // but this basic test confirms the routes are registered and respond
});
