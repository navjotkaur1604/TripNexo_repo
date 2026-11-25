const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { createHttpLogger } = require('../middleware/httpLogger');
const { notFoundHandler, errorHandler } = require('../middleware/errorHandler');

/**
 * Shared Express factory used by both the monolith and individual microservices
 * to ensure consistent security headers, CORS, JSON parsing, logging, and error handling.
 */
function createBaseApp(serviceName, { mountStaticUploads = false } = {}) {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: env.clientUrl === '*' ? true : [env.clientUrl, 'http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'],
      credentials: true,
    })
  );

  app.use(createHttpLogger(serviceName));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.nodeEnv !== 'test') {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 600,
        standardHeaders: true,
        legacyHeaders: false,
      })
    );
  }

  if (mountStaticUploads) {
    app.use('/uploads', express.static(path.resolve(env.uploadDir)));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      service: serviceName,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

function attachErrorHandlers(app) {
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createBaseApp, attachErrorHandlers };
