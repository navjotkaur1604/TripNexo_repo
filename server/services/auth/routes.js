const express = require('express');
const { body, param } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  toggleFavorite,
  logout,
} = require('./controller');
const { protect } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validate');
const { uploadProfileImage } = require('../../middleware/upload');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2 to 80 characters'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match'),
  ],
  handleValidationErrors,
  register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  login
);

router.get('/me', protect, getMe);

router.put(
  '/me',
  protect,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Name must be 2 to 80 characters'),
  ],
  handleValidationErrors,
  updateProfile
);

router.post('/profile-image', protect, uploadProfileImage.single('profileImage'), uploadAvatar);

router.post(
  '/favorites/:destinationId',
  protect,
  [param('destinationId').isMongoId().withMessage('Invalid destination ID')],
  handleValidationErrors,
  toggleFavorite
);

router.post('/logout', logout);

module.exports = router;
