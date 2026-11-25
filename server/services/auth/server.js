const env = require('../../config/env');
const { connectDB, disconnectDB } = require('../../config/db');
const { logger } = require('../../config/logger');
const { createBaseApp, attachErrorHandlers } = require('../../shared/createServiceApp');
const authRoutes = require('./routes');
const adminRoutes = require('../../routes/adminRoutes');

async function startAuthService() {
  await connectDB();
  const app = createBaseApp('auth-service', { mountStaticUploads: true });

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  attachErrorHandlers(app);

  const server = app.listen(env.authServicePort, () => {
    logger.info(`Auth Service listening on port ${env.authServicePort}`);
  });

  const shutdown = () => server.close(() => disconnectDB().then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startAuthService().catch((err) => {
  logger.error('Auth Service failed to start', { message: err.message });
  process.exit(1);
});
