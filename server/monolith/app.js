const { createBaseApp, attachErrorHandlers } = require('../shared/createServiceApp');
const authRoutes = require('../services/auth/routes');
const destinationRoutes = require('../services/destinations/routes');
const tripRoutes = require('../services/trips/routes');
const budgetRoutes = require('../services/budget/routes');
const reviewRoutes = require('../routes/reviewRoutes');
const adminRoutes = require('../routes/adminRoutes');

function createMonolithApp() {
  const app = createBaseApp('tripnexo-monolith', { mountStaticUploads: true });

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      mode: 'monolith',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/destinations', destinationRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/budget', budgetRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/admin', adminRoutes);

  return attachErrorHandlers(app);
}

module.exports = { createMonolithApp };
