const env = require('../../config/env');
const { connectDB, disconnectDB } = require('../../config/db');
const { redisCache } = require('../../config/redis');
const { logger } = require('../../config/logger');
const { createBaseApp, attachErrorHandlers } = require('../../shared/createServiceApp');
const Destination = require('../../models/Destination');
const rajasthanDestinations = require('../../data/rajasthanDestinations');
const destinationRoutes = require('./routes');
const reviewRoutes = require('../../routes/reviewRoutes');

async function startDestinationService() {
  await connectDB();
  await redisCache.connect();

  const count = await Destination.countDocuments();
  if (count === 0) {
    await Destination.insertMany(rajasthanDestinations);
    logger.info('Destination Service auto-seeded Rajasthan destinations', {
      count: rajasthanDestinations.length,
    });
  }

  const app = createBaseApp('destination-service');
  app.use('/api/destinations', destinationRoutes);
  app.use('/api/reviews', reviewRoutes);
  attachErrorHandlers(app);

  const server = app.listen(env.destinationServicePort, () => {
    logger.info(`Destination Service listening on port ${env.destinationServicePort}`);
  });

  const shutdown = () =>
    server.close(async () => {
      await redisCache.disconnect();
      await disconnectDB();
      process.exit(0);
    });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startDestinationService().catch((err) => {
  logger.error('Destination Service failed to start', { message: err.message });
  process.exit(1);
});
