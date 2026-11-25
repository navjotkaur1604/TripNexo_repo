const env = require('../../config/env');
const { connectDB, disconnectDB } = require('../../config/db');
const { logger } = require('../../config/logger');
const { createBaseApp, attachErrorHandlers } = require('../../shared/createServiceApp');
const tripRoutes = require('./routes');

// Ensure referenced models are registered on this service's Mongoose connection
require('../../models/Destination');
require('../../models/User');

async function startTripService() {
  await connectDB();
  const app = createBaseApp('trip-service');
  app.use('/api/trips', tripRoutes);
  attachErrorHandlers(app);

  const server = app.listen(env.tripServicePort, () => {
    logger.info(`Trip & Itinerary Service listening on port ${env.tripServicePort}`);
  });

  const shutdown = () => server.close(() => disconnectDB().then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startTripService().catch((err) => {
  logger.error('Trip Service failed to start', { message: err.message });
  process.exit(1);
});
