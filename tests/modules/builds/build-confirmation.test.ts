process.env.API_KEY = 'test-key';
process.env.MCP_RPC_URL = process.env.MCP_RPC_URL || 'http://dummy-mcp-rpc-url';
process.env.MCP_SSE_URL = process.env.MCP_SSE_URL || 'http://dummy-mcp-sse-url';

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { buildApp } from '../../../src/app.js';
import { PrismaClient, BuildStatus } from '../../../src/generated/prisma/index.js';
import { createMockPrismaClient } from '../../utils/test-db-helper.js';

describe('POST /builds/:build_id/confirm', () => {
  let app;
  let prisma;

  beforeAll(async () => {
    // Initialize mock Prisma client
    prisma = createMockPrismaClient() as unknown as PrismaClient;
    
    // Build the app with test configuration and inject our mock Prisma client
    app = await buildApp({ 
      apiKey: 'test-key', 
      logger: false,
      prisma // Pass our mock Prisma client
    });
    
    // Decorate Fastify to always have a test user for requests
    app.decorateRequest('user', null);
    app.addHook('onRequest', (req, _reply, done) => {
      req.user = { id: 'test-user' };
      done();
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset mocks between tests
    vi.clearAllMocks();
  });

  it('should confirm a build with valid ID and state', async () => {
    // Setup mock for a test build in PENDING_USER_FEEDBACK state
    const testBuildId = 'test-build-confirm-1';
    const testBuild = {
      id: testBuildId,
      targetUrls: JSON.stringify(['https://example.com']),
      userObjective: 'Test objective',
      status: BuildStatus.PENDING_USER_FEEDBACK,
      initialPackageJson: { test: 'config' },
      sampleResultsJson: { test: 'results' },
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'test-user'
    };
    
    // Setup mocks for Prisma queries
    prisma.build.findUnique = vi.fn().mockImplementation(({ where }) => {
      if (where.id === testBuildId) {
        return testBuild;
      }
      return null;
    });
    
    // Mock the update call
    const mockUpdatedBuild = {
      ...testBuild,
      status: BuildStatus.CONFIRMED,
      finalPackageJson: { test: 'config' },
      updatedAt: new Date()
    };
    prisma.build.update = vi.fn().mockResolvedValue(mockUpdatedBuild);

    // Call the confirm endpoint
    const response = await app.inject({
      method: 'POST',
      url: `/builds/${testBuildId}/confirm`,
      headers: { Authorization: 'Bearer test-key' }
    });
    
    // Verify response
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.build_id).toBe(testBuildId);
    expect(responseBody.status).toBe(BuildStatus.CONFIRMED);
    expect(responseBody.message).toContain('successfully confirmed');

    // Verify the update was called
    expect(prisma.build.update).toHaveBeenCalled();
  });

  it('should return 404 for non-existent build ID', async () => {
    // Setup findUnique mock to return null for any ID
    prisma.build.findUnique = vi.fn().mockResolvedValue(null);
    
    const response = await app.inject({
      method: 'POST',
      url: '/builds/non-existent-id/confirm',
      headers: { Authorization: 'Bearer test-key' }
    });

    expect(response.statusCode).toBe(404);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toContain('not found');
  });

  it('should return 409 for build in wrong state', async () => {
    // Setup mock for a test build in CONFIRMED state
    const testBuildId = 'test-build-confirm-2';
    const testBuild = {
      id: testBuildId,
      targetUrls: JSON.stringify(['https://example.com']),
      userObjective: 'Test objective',
      status: BuildStatus.CONFIRMED,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'test-user'
    };
    
    // Setup findUnique mock to return our confirmed build
    prisma.build.findUnique = vi.fn().mockResolvedValue(testBuild);

    const response = await app.inject({
      method: 'POST',
      url: `/builds/${testBuildId}/confirm`,
      headers: { Authorization: 'Bearer test-key' }
    });

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body).message).toContain('Cannot confirm build');
    expect(JSON.parse(response.body).message).toContain(BuildStatus.PENDING_USER_FEEDBACK);
  });

  it('should return 500 for build missing required data', async () => {
    // Setup mock for a test build missing required data
    const testBuildId = 'test-build-confirm-3';
    const testBuild = {
      id: testBuildId,
      targetUrls: JSON.stringify(['https://example.com']),
      userObjective: 'Test objective',
      status: BuildStatus.PENDING_USER_FEEDBACK,
      // Missing initialPackageJson and sampleResultsJson
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'test-user'
    };
    
    // Setup findUnique mock to return our test build without required data
    prisma.build.findUnique = vi.fn().mockResolvedValue(testBuild);

    const response = await app.inject({
      method: 'POST',
      url: `/builds/${testBuildId}/confirm`,
      headers: { Authorization: 'Bearer test-key' }
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toContain('missing required data');
  });

  it('should handle database errors during update', async () => {
    // Setup mock for a test build in PENDING_USER_FEEDBACK state
    const testBuildId = 'test-build-confirm-4';
    const testBuild = {
      id: testBuildId,
      targetUrls: JSON.stringify(['https://example.com']),
      userObjective: 'Test objective',
      status: BuildStatus.PENDING_USER_FEEDBACK,
      initialPackageJson: { test: 'config' },
      sampleResultsJson: { test: 'results' },
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'test-user'
    };
    
    // Setup findUnique mock to return our test build
    prisma.build.findUnique = vi.fn().mockResolvedValue(testBuild);

    // Mock Prisma update to simulate a database error
    prisma.build.update = vi.fn().mockRejectedValue(new Error('Database connection error'));

    const response = await app.inject({
      method: 'POST',
      url: `/builds/${testBuildId}/confirm`,
      headers: { Authorization: 'Bearer test-key' }
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toContain('Failed to update build status');
  });
});
