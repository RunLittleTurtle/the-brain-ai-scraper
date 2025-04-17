process.env.API_KEY = 'test-key';
process.env.MCP_RPC_URL = process.env.MCP_RPC_URL || 'http://dummy-mcp-rpc-url';
process.env.MCP_SSE_URL = process.env.MCP_SSE_URL || 'http://dummy-mcp-sse-url';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../../src/app.js'; // Use app from source for live route registration
import { Type } from '@sinclair/typebox';

const validBody = {
  build_id: '123e4567-e89b-12d3-a456-426614174000',
  target_urls: ['https://example.com']
};

const invalidBody = {
  build_id: 'not-a-uuid',
  target_urls: ['not-a-url']
};

describe('POST /runs', () => {
  let app;
  let prisma;
  const buildId = '123e4567-e89b-12d3-a456-426614174000';
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
  beforeEach(async () => {
    // Insert a valid build with CONFIRMED status and a valid finalConfigurationJson
    await prisma.build.create({
      data: {
        id: buildId,
        userObjective: 'Test objective',
        targetUrls: JSON.stringify(['https://example.com']),
        status: 'CONFIRMED',
        userId: 'test-user',
        finalConfigurationJson: JSON.stringify({
          scraper: { tool_id: 'scraper:dummy', parameters: { selectors: { title: 'h1' } } }
        })
      }
    });
  });
  afterEach(async () => {
    await prisma.run.deleteMany({ where: { buildId } });
    await prisma.build.deleteMany({ where: { id: buildId } });
  });

  it('returns 200 and a run_id for valid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/runs',
      headers: { Authorization: 'Bearer test-key' },
      payload: validBody
    });
    if (res.statusCode !== 200) {
      console.error('DEBUG FAIL 200:', res.statusCode, res.body);
    }
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('run_id');
    expect(body).toHaveProperty('message');
  });

  it('returns 400 for invalid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/runs',
      headers: { Authorization: 'Bearer test-key' },
      payload: invalidBody
    });
    if (res.statusCode !== 400) {
      console.error('DEBUG FAIL 400:', res.statusCode, res.body);
    }
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('errors');
  });
});
