const http = require('http');
const express = require('express');
const request = require('supertest');

process.env.NODE_ENV = 'test';

describe('API Gateway Routing & Failure Handling', () => {
  let mockAuthServer;
  let gatewayApp;

  beforeAll(async () => {
    const mockAuth = express();
    mockAuth.get('/health', (_req, res) => res.json({ status: 'healthy' }));
    mockAuth.get('/api/auth/ping', (_req, res) => res.json({ service: 'auth', ok: true }));

    mockAuthServer = http.createServer(mockAuth);
    await new Promise((resolve) => mockAuthServer.listen(0, '127.0.0.1', resolve));
    const port = mockAuthServer.address().port;

    process.env.AUTH_SERVICE_URL = `http://127.0.0.1:${port}`;
    process.env.DESTINATION_SERVICE_URL = 'http://127.0.0.1:59992';
    process.env.TRIP_SERVICE_URL = 'http://127.0.0.1:59993';
    process.env.BUDGET_SERVICE_URL = 'http://127.0.0.1:59994';

    // Load gateway after setting test discovery URLs
    jest.resetModules();
    const { createGatewayApp } = require('../gateway/server');
    gatewayApp = createGatewayApp();
  });

  afterAll(async () => {
    await new Promise((resolve) => mockAuthServer.close(resolve));
  });

  test('routes /api/auth/* to Auth microservice and aggregates /api/health', async () => {
    const pingRes = await request(gatewayApp).get('/api/auth/ping');
    expect(pingRes.status).toBe(200);
    expect(pingRes.body.service).toBe('auth');

    const healthRes = await request(gatewayApp).get('/api/health');
    expect(healthRes.status).toBe(207);
    expect(healthRes.body.services.auth).toBe('up');
    expect(healthRes.body.services.destinations).toBe('down');
  });

  test('returns clean 503 JSON when a downstream microservice is unavailable', async () => {
    const res = await request(gatewayApp).get('/api/destinations');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/unavailable/i);
  });
});
