const express = require('express');
const { body, param } = require('express-validator');
const {
  createReview,
  getDestinationReviews,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

router.get(
  '/:destinationId',
  [param('destinationId').isMongoId().withMessage('Invalid destination ID')],
  handleValidationErrors,
  getDestinationReviews
);

router.post(
  '/',
  protect,
  [
    body('destinationId').isMongoId().withMessage('Valid destinationId is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().isLength({ min: 5, max: 800 }).withMessage('Comment must be 5 to 800 characters'),
  ],
  handleValidationErrors,
  createReview
);

router.put(
  '/:id',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid review ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ min: 5, max: 800 }).withMessage('Comment must be 5 to 800 characters'),
  ],
  handleValidationErrors,
  updateReview
);

router.delete(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid review ID')],
  handleValidationErrors,
  deleteReview
);

module.exports = router;
