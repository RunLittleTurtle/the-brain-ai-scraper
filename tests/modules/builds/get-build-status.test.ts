process.env.MCP_RPC_URL = 'http://dummy-mcp-rpc-url';
process.env.MCP_SSE_URL = 'http://dummy-mcp-sse-url';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { buildApp } from '../../../src/app.js';
import { FastifyInstance } from 'fastify';
import { PrismaClient, BuildStatus, Prisma } from '../../../src/generated/prisma/index.js';
import { randomUUID } from 'crypto';
import { createMockPrismaClient } from '../../utils/test-db-helper.js';

const TEST_API_KEY = 'test-api-key-for-get-build';
process.env.API_KEY = TEST_API_KEY;

describe('GET /builds/:build_id functionality', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  
  // Test data with UUID format for build IDs
  const testUserId = 'test-user-1';
  const validBuildId = randomUUID(); // Generate a valid UUID for testing
  const pendingFeedbackBuildId = randomUUID();
  const confirmedBuildId = randomUUID();
  const corruptedSamplesBuildId = randomUUID();
  const corruptedUrlsBuildId = randomUUID();
  
  // Mock build data for responses
  const mockBuilds = new Map();
  
  const sampleResults = {
    urls: [
      {
        url: 'https://example.com',
        title: 'Example Domain',
        content: 'This domain is for use in illustrative examples.'
      }
    ],
    timing: {
      total_ms: 1200
    },
    tool_info: {
      id: 'scraper:cheerio',
      version: '1.0.0'
    }
  };
  const tempConfig = {
    scraper: {
      tool_id: 'scraper:cheerio',
      parameters: {
        selectors: {
          title: 'h1',
          content: 'p'
        }
      }
    }
  };

  beforeAll(async () => {
    // Initialize mock Prisma client
    prisma = createMockPrismaClient() as unknown as PrismaClient;
    
    // Setup mock behavior
    prisma.build.findUnique = vi.fn().mockImplementation(({ where }) => {
      // Return the mocked build if it exists
      return mockBuilds.get(where.id) || null;
    });
    
    prisma.build.create = vi.fn().mockImplementation(({ data }) => {
      const build = {
        ...data,
        id: data.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockBuilds.set(data.id, build);
      return build;
    });
    
    // Initialize app with test API key and inject our mock Prisma client
    app = await buildApp({ 
      apiKey: TEST_API_KEY, 
      logger: false,
      prisma // Explicitly pass our mock Prisma client to the app
    });
  });

  afterAll(async () => {
    // Close the Fastify app
    await app.close();
  });

  beforeEach(() => {
    // Clear mock builds before each test
    mockBuilds.clear();
    vi.clearAllMocks();
  });

  it('should return the correct build status for a valid build', async () => {
    // Create a test build with explicit UUID id
    const build = await prisma.build.create({
      data: {
        id: validBuildId, // Use our UUID
        userObjective: 'Test objective',
        targetUrls: JSON.stringify(['https://example.com']),
        userId: testUserId,
        status: BuildStatus.PENDING_ANALYSIS
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: `/builds/${build.id}`,
      headers: { 'Authorization': `Bearer ${TEST_API_KEY}` }
    });

    // Debug info if the response is not 200
    if (response.statusCode !== 200) {
      console.log(`DEBUG - Response Error for ${build.id}:`, response.statusCode, response.body);
    }

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('build_id', build.id);
    expect(body).toHaveProperty('status', BuildStatus.PENDING_ANALYSIS);
    expect(body).toHaveProperty('target_urls');
    expect(body.target_urls).toEqual(['https://example.com']);
    expect(body).toHaveProperty('created_at');
    expect(body).toHaveProperty('updated_at');
  });

  it('should include sample results when build is in PENDING_USER_FEEDBACK state', async () => {
    // Create a test build with sample results and UUID
    const build = await prisma.build.create({
      data: {
        id: pendingFeedbackBuildId, // Use our UUID
        userObjective: 'Test objective',
        targetUrls: JSON.stringify(['https://example.com']),
        userId: testUserId,
        status: BuildStatus.PENDING_USER_FEEDBACK,
        sampleResultsJson: JSON.stringify(sampleResults),
        initialPackageJson: JSON.stringify(tempConfig)
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: `/builds/${build.id}`,
      headers: { 'Authorization': `Bearer ${TEST_API_KEY}` }
    });

    // Debug info if the response is not 200
    if (response.statusCode !== 200) {
      console.log(`DEBUG - Response Error for ${build.id}:`, response.statusCode, response.body);
    }

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('build_id', build.id);
    expect(body).toHaveProperty('status', BuildStatus.PENDING_USER_FEEDBACK);
    expect(body).toHaveProperty('package_results');
    expect(body.package_results).toEqual(sampleResults);
  });

  it('should not include sample results when build is not in PENDING_USER_FEEDBACK state', async () => {
    // Create a test build in a different state with UUID
    const build = await prisma.build.create({
      data: {
        id: confirmedBuildId, // Use our UUID
        userObjective: 'Test objective',
        targetUrls: JSON.stringify(['https://example.com']),
        userId: testUserId,
        status: BuildStatus.CONFIRMED,
        sampleResultsJson: JSON.stringify(sampleResults), // Even though it has results
        finalPackageJson: JSON.stringify(tempConfig)
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: `/builds/${build.id}`,
      headers: { 'Authorization': `Bearer ${TEST_API_KEY}` }
    });

    // Debug info if the response is not 200
    if (response.statusCode !== 200) {
      console.log(`DEBUG - Response Error for ${build.id}:`, response.statusCode, response.body);
    }

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('build_id', build.id);
    expect(body).toHaveProperty('status', BuildStatus.CONFIRMED);
    expect(body).not.toHaveProperty('package_results');
  });

  it('should handle corrupted sample results JSON gracefully', async () => {
    // Create a test build with corrupted sample results and UUID
    const build = await prisma.build.create({
      data: {
        id: corruptedSamplesBuildId, // Use our UUID
        userObjective: 'Test objective',
        targetUrls: JSON.stringify(['https://example.com']),
        userId: testUserId,
        status: BuildStatus.PENDING_USER_FEEDBACK,
        sampleResultsJson: '{invalid-json: this should cause an error}' // Invalid JSON
        // Test database doesn't have the updated schema
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: `/builds/${build.id}`,
      headers: { 'Authorization': `Bearer ${TEST_API_KEY}` }
    });

    // Debug info if the response is not 200
    if (response.statusCode !== 200) {
      console.log(`DEBUG - Response Error for ${build.id}:`, response.statusCode, response.body);
    }

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('build_id', build.id);
    expect(body).toHaveProperty('status', BuildStatus.PENDING_USER_FEEDBACK);
    expect(body).toHaveProperty('package_results', null);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Sample results data corrupted');
  });

  it('should handle corrupted target URLs JSON gracefully', async () => {
    // Create a test build with corrupted target URLs and UUID
    const build = await prisma.build.create({
      data: {
        id: corruptedUrlsBuildId, // Use our UUID
        userObjective: 'Test objective',
        targetUrls: '{invalid-json: this should cause an error}', // Invalid JSON
        userId: testUserId,
        status: BuildStatus.PENDING_ANALYSIS,
        // Test database doesn't have the updated schema
      }
    });

    const response = await app.inject({
      method: 'GET',
      url: `/builds/${build.id}`,
      headers: { 'Authorization': `Bearer ${TEST_API_KEY}` }
    });

    expect(response.statusCode).toBe(500);
    const body = response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toBe('Failed to parse build data.');
  });

  it('should return 404 for a build that does not exist', async () => {
    const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
    const response = await app.inject({
      method: 'GET',
      url: `/builds/${nonExistentId}`,
      headers: { 'Authorization': `Bearer ${TEST_API_KEY}` }
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('not found');
  });
});
