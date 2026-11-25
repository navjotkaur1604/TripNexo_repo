const express = require('express');
const { body, param } = require('express-validator');
const {
  listDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
} = require('./controller');
const { protect, authorize } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validate');

const router = express.Router();

router.get('/', listDestinations);
router.get('/:id', getDestinationById);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Destination name is required'),
    body('region').trim().notEmpty().withMessage('Region is required'),
    body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('recommendedDays').isInt({ min: 1, max: 14 }).withMessage('Recommended days must be between 1 and 14'),
  ],
  handleValidationErrors,
  createDestination
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid destination ID')],
  handleValidationErrors,
  updateDestination
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid destination ID')],
  handleValidationErrors,
  deleteDestination
);

module.exports = router;
