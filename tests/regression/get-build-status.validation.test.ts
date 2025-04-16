process.env.MCP_RPC_URL = 'http://dummy-mcp-rpc-url';
process.env.MCP_SSE_URL = 'http://dummy-mcp-sse-url';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '../../src/generated/prisma/index.js';

const TEST_API_KEY = 'test-api-key-from-env';
process.env.API_KEY = TEST_API_KEY;

describe('GET /builds/:build_id input validation', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
    prisma = app.prisma;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 404 for root builds path (missing ID)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/builds/',
      headers: { Authorization: `Bearer ${TEST_API_KEY}` },
    });
    expect(response.statusCode).toBe(404);
  });

  it('should reject invalid build_id format with 400', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/builds/not-a-uuid',
      headers: { Authorization: `Bearer ${TEST_API_KEY}` },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().message).toMatch(/params\/build_id must match format \"uuid\"/);
  });

  it('should reject request with missing API key with 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/builds/123e4567-e89b-12d3-a456-426614174000',
    });
    expect(response.statusCode).toBe(401);
  });

  it('should reject request with invalid API key with 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/builds/123e4567-e89b-12d3-a456-426614174000',
      headers: { Authorization: 'Bearer invalid-key' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('should return 404 for a valid build_id that does not exist', async () => {
    const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
    const response = await app.inject({
      method: 'GET',
      url: `/builds/${nonExistentId}`,
      headers: { Authorization: `Bearer ${TEST_API_KEY}` },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().message).toMatch(/Build with ID .* not found/);
  });
});
