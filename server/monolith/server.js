const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { redisCache } = require('../config/redis');
const { logger } = require('../config/logger');
const Destination = require('../models/Destination');
const rajasthanDestinations = require('../data/rajasthanDestinations');
const { createMonolithApp } = require('./app');

async function startMonolith() {
  await connectDB();
  await redisCache.connect();

  const count = await Destination.countDocuments();
  if (count === 0) {
    await Destination.insertMany(rajasthanDestinations);
    logger.info('Auto-seeded initial Rajasthan destinations dataset', {
      count: rajasthanDestinations.length,
    });
  }

  const app = createMonolithApp();
  const server = app.listen(env.port, () => {
    logger.info(`TripNexo monolith API running on port ${env.port}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down TripNexo monolith server...');
    server.close(async () => {
      await redisCache.disconnect();
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startMonolith().catch((err) => {
  logger.error('Failed to start monolith server', { message: err.message });
  process.exit(1);
});
