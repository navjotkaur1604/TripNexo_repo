const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const env = require('../config/env');
const { logger } = require('../config/logger');
const { createHttpLogger } = require('../middleware/httpLogger');

const SERVICES = {
  auth: env.authServiceUrl,
  destinations: env.destinationServiceUrl,
  trips: env.tripServiceUrl,
  budget: env.budgetServiceUrl,
};

function createServiceProxy(pathFilter, target, serviceName) {
  return createProxyMiddleware({
    pathFilter,
    target,
    changeOrigin: true,
    proxyTimeout: 10000,
    timeout: 10000,
    on: {
      proxyReq: (_proxyReq, req) => {
        logger.debug('Gateway routing request', {
          service: serviceName,
          method: req.method,
          path: req.originalUrl,
        });
      },
      error: (err, req, res) => {
        logger.error('Gateway downstream service failure', {
          service: serviceName,
          target,
          path: req.originalUrl,
          message: err.message,
        });
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: `${serviceName} is currently unavailable. Please try again shortly.`,
          });
        }
      },
    },
  });
}

function createGatewayApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin:
        env.clientUrl === '*'
          ? true
          : [env.clientUrl, 'http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'],
      credentials: true,
    })
  );

  app.use(createHttpLogger('api-gateway'));

  if (env.nodeEnv !== 'test') {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 800,
        standardHeaders: true,
        legacyHeaders: false,
      })
    );
  }

  app.get('/api/health', async (_req, res) => {
    const checks = await Promise.all(
      Object.entries(SERVICES).map(async ([name, baseUrl]) => {
        try {
          const resp = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2500) });
          return [name, resp.ok ? 'up' : `degraded (${resp.status})`];
        } catch {
          return [name, 'down'];
        }
      })
    );
    const services = Object.fromEntries(checks);
    const allUp = Object.values(services).every((s) => s === 'up');

    res.status(allUp ? 200 : 207).json({
      success: allUp,
      mode: 'api-gateway',
      gateway: 'healthy',
      services,
      discovery: SERVICES,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(createServiceProxy(['/api/auth', '/api/admin', '/uploads'], SERVICES.auth, 'auth-service'));
  app.use(createServiceProxy(['/api/destinations', '/api/reviews'], SERVICES.destinations, 'destination-service'));
  app.use(createServiceProxy(['/api/trips'], SERVICES.trips, 'trip-service'));
  app.use(createServiceProxy(['/api/budget'], SERVICES.budget, 'budget-service'));

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Gateway route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  return app;
}

if (require.main === module) {
  const app = createGatewayApp();
  app.listen(env.gatewayPort, () => {
    logger.info(`TripNexo API Gateway running on port ${env.gatewayPort}`, { services: SERVICES });
  });
}

module.exports = { createGatewayApp };
