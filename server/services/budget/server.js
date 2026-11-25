const env = require('../../config/env');
const { connectDB, disconnectDB } = require('../../config/db');
const { logger } = require('../../config/logger');
const { createBaseApp, attachErrorHandlers } = require('../../shared/createServiceApp');
const budgetRoutes = require('./routes');

require('../../models/Destination');
require('../../models/Trip');
require('../../models/User');

async function startBudgetService() {
  await connectDB();
  const app = createBaseApp('budget-service');
  app.use('/api/budget', budgetRoutes);
  attachErrorHandlers(app);

  const server = app.listen(env.budgetServicePort, () => {
    logger.info(`Budget Service listening on port ${env.budgetServicePort}`);
  });

  const shutdown = () => server.close(() => disconnectDB().then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startBudgetService().catch((err) => {
  logger.error('Budget Service failed to start', { message: err.message });
  process.exit(1);
});
