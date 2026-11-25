const User = require('../models/User');
const Trip = require('../models/Trip');
const Destination = require('../models/Destination');
const Review = require('../models/Review');
const { redisCache } = require('../config/redis');

async function getDashboard(_req, res, next) {
  try {
    const [totalUsers, totalDestinations, totalTrips, totalReviews, tripsByStatus, popularDestinations] =
      await Promise.all([
        User.countDocuments(),
        Destination.countDocuments(),
        Trip.countDocuments(),
        Review.countDocuments(),
        Trip.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Trip.aggregate([
          { $unwind: '$destinations' },
          { $group: { _id: '$destinations.destinationId', tripCount: { $sum: 1 } } },
          { $sort: { tripCount: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'destinations',
              localField: '_id',
              foreignField: '_id',
              as: 'destination',
            },
          },
          { $unwind: '$destination' },
          {
            $project: {
              _id: 1,
              tripCount: 1,
              name: '$destination.name',
              region: '$destination.region',
            },
          },
        ]),
      ]);

    res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        totalDestinations,
        totalTrips,
        totalReviews,
        redisConnected: redisCache.isReady,
        tripsByStatus,
        popularDestinations,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      users,
    });
  } catch (error) {
    next(error);
  }
}

async function getAllTrips(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const [trips, total] = await Promise.all([
      Trip.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email')
        .populate('destinations.destinationId', 'name region')
        .lean(),
      Trip.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      trips,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard, getUsers, getAllTrips };
