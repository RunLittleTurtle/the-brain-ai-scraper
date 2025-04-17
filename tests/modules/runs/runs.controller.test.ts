process.env.MCP_RPC_URL = process.env.MCP_RPC_URL || 'http://dummy-mcp-rpc-url';
process.env.MCP_SSE_URL = process.env.MCP_SSE_URL || 'http://dummy-mcp-sse-url';
import { describe, it, expect } from 'vitest';
import { buildApp } from '../../../dist/app.js'; // Fallback: import from built output
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
  beforeAll(async () => {
    app = await buildApp({ apiKey: 'test-key', logger: false });
  });

  it('returns 200 and a run_id for valid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/runs',
      headers: { 'x-api-key': 'test-key' },
      payload: validBody
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('run_id');
    expect(body).toHaveProperty('message');
  });

  it('returns 400 for invalid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/runs',
      headers: { 'x-api-key': 'test-key' },
      payload: invalidBody
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('errors');
  });
});
