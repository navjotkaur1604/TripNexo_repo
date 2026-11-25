const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const env = require('../../config/env');
const { AppError } = require('../../middleware/auth');
const { getStorageAdapter } = require('../../storage/storageAdapter');
const { logger } = require('../../config/logger');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
    });

    const token = signToken(user);
    logger.info('New user registered', { userId: user._id });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const token = signToken(user);
    logger.info('User logged in', { userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('favorites', 'name slug region images recommendedDays accommodation bestSeason coordinates');

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    })
      .select('-password')
      .populate('favorites', 'name slug region images recommendedDays accommodation bestSeason coordinates');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return next(new AppError('Please choose an image file (JPG, PNG, or WEBP).', 400));
    }

    const adapter = getStorageAdapter();
    const saved = await adapter.saveFile(req.file.buffer, req.file.originalname, req.file.mimetype);

    if (req.user.profileImage && req.user.profileImage.startsWith('/uploads/')) {
      await adapter.deleteFile(req.user.profileImage).catch(() => {});
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: saved.url },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully.',
      storageDriver: saved.driver,
      profileImage: saved.url,
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function toggleFavorite(req, res, next) {
  try {
    const { destinationId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    const exists = user.favorites.some((id) => String(id) === String(destinationId));
    if (exists) {
      user.favorites = user.favorites.filter((id) => String(id) !== String(destinationId));
    } else {
      user.favorites.push(destinationId);
    }

    await user.save();
    await user.populate('favorites', 'name slug region images recommendedDays accommodation bestSeason coordinates');

    res.status(200).json({
      success: true,
      isFavorite: !exists,
      favorites: user.favorites,
    });
  } catch (error) {
    next(error);
  }
}

async function logout(_req, res) {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  toggleFavorite,
  logout,
};
