process.env.API_KEY = 'test-key';
process.env.MCP_RPC_URL = process.env.MCP_RPC_URL || 'http://dummy-mcp-rpc-url';
process.env.MCP_SSE_URL = process.env.MCP_SSE_URL || 'http://dummy-mcp-sse-url';

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { buildApp } from '../../../src/app.js';
import { PrismaClient, BuildStatus } from '../../../src/generated/prisma/index.js';

describe('POST /builds/:build_id/confirm', () => {
  let app;
  let prisma;

  beforeAll(async () => {
    app = await buildApp({ apiKey: 'test-key', logger: false });
    // Decorate Fastify to always have a test user for requests
    app.decorateRequest('user', null);
    app.addHook('onRequest', (req, _reply, done) => {
      req.user = { id: 'test-user' };
      done();
    });
    const { PrismaClient } = await import('../../../src/generated/prisma/index.js');
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.run.deleteMany({});
    await prisma.build.deleteMany({});
  });

  it('should confirm a build with valid ID and state', async () => {
    // Create a test build in PENDING_USER_FEEDBACK state
    const testBuild = await prisma.build.create({
      data: {
        targetUrls: JSON.stringify(['https://example.com']),
        userObjective: 'Test objective',
        status: BuildStatus.PENDING_USER_FEEDBACK,
        initialPackageJson: { test: 'config' },
        sampleResultsJson: { test: 'results' }
      }
    });

    // Call the confirm endpoint
    const response = await app.inject({
      method: 'POST',
      url: `/builds/${testBuild.id}/confirm`,
      headers: { Authorization: 'Bearer test-key' }
    });

    // Debug response
    console.log('Response body:', response.body);
    
    // Verify response
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.build_id).toBe(testBuild.id);
    expect(responseBody.status).toBe(BuildStatus.CONFIRMED);
    expect(responseBody.message).toContain('successfully confirmed');

    // Verify database updates
    const updatedBuild = await prisma.build.findUnique({
      where: { id: testBuild.id }
    });
    expect(updatedBuild?.status).toBe(BuildStatus.CONFIRMED);
    expect(updatedBuild?.finalConfigurationJson).toEqual({ test: 'config' });
  });

  it('should return 404 for non-existent build ID', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/builds/clh0j8cxz0000abcd1234efgh/confirm', // Valid CUID format but doesn't exist
      headers: { Authorization: 'Bearer test-key' }
    });

    expect(response.statusCode).toBe(404);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toContain('not found');
  });

  it('should return 409 for build in wrong state', async () => {
    // Create a test build in a state other than PENDING_USER_FEEDBACK
    const testBuild = await prisma.build.create({
      data: {
        targetUrls: JSON.stringify(['https://example.com']),
        userObjective: 'Test objective',
        status: BuildStatus.PENDING_ANALYSIS,
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: `/builds/${testBuild.id}/confirm`,
      headers: { Authorization: 'Bearer test-key' }
    });

    expect(response.statusCode).toBe(409);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toContain('Cannot confirm build');
    expect(responseBody.message).toContain(BuildStatus.PENDING_USER_FEEDBACK);
  });

  it('should return 500 for build missing required data', async () => {
    // Create a test build without sample results or initial package
    const testBuild = await prisma.build.create({
      data: {
        targetUrls: JSON.stringify(['https://example.com']),
        userObjective: 'Test objective',
        status: BuildStatus.PENDING_USER_FEEDBACK,
        // Intentionally omit sampleResultsJson and initialPackageJson
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: `/builds/${testBuild.id}/confirm`,
      headers: { Authorization: 'Bearer test-key' }
    });

    expect(response.statusCode).toBe(500);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toContain('missing required data');
  });

  it('should handle database errors during update', async () => {
    // Create a test build in PENDING_USER_FEEDBACK state
    const testBuild = await prisma.build.create({
      data: {
        targetUrls: JSON.stringify(['https://example.com']),
        userObjective: 'Test objective',
        status: BuildStatus.PENDING_USER_FEEDBACK,
        initialPackageJson: { test: 'config' },
        sampleResultsJson: { test: 'results' }
      }
    });

    // Create a more effective spy/mock on the Prisma client
    // First backup the Prisma client instance from the app 
    const appPrisma = app.prisma;
    
    // Replace prisma in the app with our mocked version
    app.prisma = {
      ...appPrisma,
      build: {
        ...appPrisma.build,
        update: vi.fn().mockRejectedValueOnce(new Error('Database error')),
        findUnique: appPrisma.build.findUnique  // Keep the original findUnique
      }
    };

    // Call the confirm endpoint
    const response = await app.inject({
      method: 'POST',
      url: `/builds/${testBuild.id}/confirm`,
      headers: { Authorization: 'Bearer test-key' }
    });

    // Restore the original prisma instance
    app.prisma = appPrisma;

    // Verify response
    expect(response.statusCode).toBe(500);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toContain('Failed to update build status');
  });
});
