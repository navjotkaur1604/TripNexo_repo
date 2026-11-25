const express = require('express');
const { body, param } = require('express-validator');
const { estimateBudget, getTripBudget } = require('./controller');
const { protect } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validate');

const router = express.Router();

router.post(
  '/estimate',
  [
    body('destinationIds').isArray({ min: 1 }).withMessage('Select at least one destination'),
    body('travellers').optional().isInt({ min: 1, max: 30 }).withMessage('Travellers must be 1 to 30'),
    body('children').optional().isInt({ min: 0, max: 20 }).withMessage('Children must be 0 to 20'),
  ],
  handleValidationErrors,
  estimateBudget
);

router.get(
  '/trip/:tripId',
  protect,
  [param('tripId').isMongoId().withMessage('Invalid trip ID')],
  handleValidationErrors,
  getTripBudget
);

module.exports = router;
