const mongoose = require('mongoose');
const Review = require('../models/Review');
const Destination = require('../models/Destination');
const { AppError } = require('../middleware/auth');
const { redisCache } = require('../config/redis');

async function recalculateDestinationRating(destinationId) {
  const stats = await Review.aggregate([
    { $match: { destinationId: new mongoose.Types.ObjectId(destinationId) } },
    {
      $group: {
        _id: '$destinationId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Destination.findByIdAndUpdate(destinationId, {
      averageRating: Number(stats[0].averageRating.toFixed(1)),
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Destination.findByIdAndUpdate(destinationId, {
      averageRating: 4.5,
      reviewCount: 0,
    });
  }

  await redisCache.invalidatePattern('dest:*');
}

async function createReview(req, res, next) {
  try {
    const { destinationId, rating, comment } = req.body;
    const dest = await Destination.findById(destinationId);
    if (!dest) {
      return next(new AppError('Destination not found.', 404));
    }

    const existing = await Review.findOne({ userId: req.user._id, destinationId });
    if (existing) {
      return next(new AppError('You have already reviewed this destination. You can edit your existing review.', 409));
    }

    const review = await Review.create({
      userId: req.user._id,
      destinationId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    await recalculateDestinationRating(destinationId);

    const populated = await Review.findById(review._id).populate('userId', 'name profileImage');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review: populated,
    });
  } catch (error) {
    next(error);
  }
}

async function getDestinationReviews(req, res, next) {
  try {
    const { destinationId } = req.params;
    const [reviews, summary] = await Promise.all([
      Review.find({ destinationId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name profileImage')
        .lean(),
      Review.aggregate([
        { $match: { destinationId: new mongoose.Types.ObjectId(destinationId) } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      ratingDistribution: summary,
      reviews,
    });
  } catch (error) {
    next(error);
  }
}

async function updateReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(new AppError('Review not found.', 404));
    }
    if (String(review.userId) !== String(req.user._id) && req.user.role !== 'admin') {
      return next(new AppError('Forbidden: you can only edit your own reviews.', 403));
    }

    if (req.body.rating !== undefined) review.rating = Number(req.body.rating);
    if (req.body.comment !== undefined) review.comment = req.body.comment.trim();
    await review.save();

    await recalculateDestinationRating(review.destinationId);

    const populated = await Review.findById(review._id).populate('userId', 'name profileImage');
    res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      review: populated,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(new AppError('Review not found.', 404));
    }
    if (String(review.userId) !== String(req.user._id) && req.user.role !== 'admin') {
      return next(new AppError('Forbidden: you can only delete your own reviews.', 403));
    }

    const { destinationId } = review;
    await Review.findByIdAndDelete(review._id);
    await recalculateDestinationRating(destinationId);

    res.status(200).json({
      success: true,
      message: 'Review deleted.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReview,
  getDestinationReviews,
  updateReview,
  deleteReview,
};
