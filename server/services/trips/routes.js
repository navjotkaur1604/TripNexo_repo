const express = require('express');
const { body, param } = require('express-validator');
const {
  createTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  regenerateTripItinerary,
  duplicateTrip,
} = require('./controller');
const { protect } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('tripName').trim().isLength({ min: 2, max: 120 }).withMessage('Trip name must be 2 to 120 characters'),
    body('destinations').isArray({ min: 1 }).withMessage('Select at least one destination'),
    body('travellers').optional().isInt({ min: 1, max: 30 }).withMessage('Travellers must be between 1 and 30'),
    body('children').optional().isInt({ min: 0, max: 20 }).withMessage('Children must be between 0 and 20'),
    body('duration').optional().isInt({ min: 1, max: 45 }).withMessage('Duration must be between 1 and 45 days'),
  ],
  handleValidationErrors,
  createTrip
);

router.get('/', getMyTrips);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid trip ID')],
  handleValidationErrors,
  getTripById
);

router.put(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid trip ID')],
  handleValidationErrors,
  updateTrip
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid trip ID')],
  handleValidationErrors,
  deleteTrip
);

router.post(
  '/:id/generate-itinerary',
  [param('id').isMongoId().withMessage('Invalid trip ID')],
  handleValidationErrors,
  regenerateTripItinerary
);

router.post(
  '/:id/duplicate',
  [param('id').isMongoId().withMessage('Invalid trip ID')],
  handleValidationErrors,
  duplicateTrip
);

module.exports = router;
