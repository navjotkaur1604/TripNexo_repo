const mongoose = require('mongoose');
const Destination = require('../../models/Destination');
const { redisCache } = require('../../config/redis');
const { AppError } = require('../../middleware/auth');
const { logger } = require('../../config/logger');

function buildSortOption(sort) {
  switch (sort) {
    case 'name_desc':
      return { name: -1 };
    case 'budget_asc':
      return { 'accommodation.moderate.min': 1, name: 1 };
    case 'budget_desc':
      return { 'accommodation.moderate.max': -1, name: 1 };
    case 'duration_asc':
      return { recommendedDays: 1, name: 1 };
    case 'duration_desc':
      return { recommendedDays: -1, name: 1 };
    case 'rating_desc':
      return { averageRating: -1, name: 1 };
    case 'name_asc':
    default:
      return { name: 1 };
  }
}

function haversineKm(coord1, coord2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function listDestinations(req, res, next) {
  try {
    const cacheKey = `dest:list:${JSON.stringify(req.query)}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json({ ...cached, cache: 'HIT' });
    }

    const {
      search,
      region,
      state,
      interest,
      bestSeason,
      maxBudget,
      maxDays,
      featured,
      sort = 'name_asc',
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { region: regex },
        { tagline: regex },
        { interests: regex },
        { 'attractions.name': regex },
      ];
    }
    if (state && state !== 'all') {
      filter.state = new RegExp(`^${state.trim()}$`, 'i');
    }
    if (region && region !== 'all') {
      filter.region = new RegExp(region.trim(), 'i');
    }
    if (interest && interest !== 'all') {
      filter.interests = { $in: [interest.trim().toLowerCase()] };
    }
    if (bestSeason && bestSeason !== 'all') {
      filter.bestSeason = bestSeason;
    }
    if (maxDays && Number(maxDays) > 0) {
      filter.recommendedDays = { $lte: Number(maxDays) };
    }
    if (maxBudget && Number(maxBudget) > 0) {
      // Filter using economical daily combined stay+food estimate <= maxBudget
      filter.$expr = {
        $lte: [
          { $add: ['$accommodation.economical.min', '$food.economical.min'] },
          Number(maxBudget),
        ],
      };
    }
    if (featured === 'true') {
      filter.featured = true;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [destinations, total, filterMeta] = await Promise.all([
      Destination.find(filter)
        .sort(buildSortOption(sort))
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Destination.countDocuments(filter),
      Destination.aggregate([
        {
          $group: {
            _id: null,
            regions: { $addToSet: '$region' },
            seasons: { $addToSet: '$bestSeason' },
          },
        },
      ]),
    ]);

    const payload = {
      success: true,
      count: destinations.length,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      hasMore: skip + destinations.length < total,
      filters: {
        regions: (filterMeta[0]?.regions || []).sort(),
        seasons: (filterMeta[0]?.seasons || []).sort(),
      },
      destinations,
    };

    await redisCache.set(cacheKey, payload);
    res.set('X-Cache', 'MISS');
    res.status(200).json({ ...payload, cache: 'MISS' });
  } catch (error) {
    next(error);
  }
}

async function getDestinationById(req, res, next) {
  try {
    const { id } = req.params;
    const cacheKey = `dest:detail:${id}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json({ ...cached, cache: 'HIT' });
    }

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id.toLowerCase() };
    const destination = await Destination.findOne(query).lean();

    if (!destination) {
      return next(new AppError('Destination not found.', 404));
    }

    // Find 3 closest Rajasthan destinations by straight-line coordinate distance
    const others = await Destination.find({ _id: { $ne: destination._id } })
      .select('name slug region tagline images coordinates recommendedDays accommodation bestSeason')
      .lean();

    const nearbyDestinations = others
      .map((other) => ({
        ...other,
        approxDistanceKm: haversineKm(destination.coordinates, other.coordinates),
      }))
      .sort((a, b) => a.approxDistanceKm - b.approxDistanceKm)
      .slice(0, 3);

    const payload = {
      success: true,
      destination,
      nearbyDestinations,
    };

    await redisCache.set(cacheKey, payload);
    res.set('X-Cache', 'MISS');
    res.status(200).json({ ...payload, cache: 'MISS' });
  } catch (error) {
    next(error);
  }
}

async function createDestination(req, res, next) {
  try {
    const payload = {
      ...req.body,
      slug:
        req.body.slug ||
        String(req.body.name || '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-'),
    };
    const destination = await Destination.create(payload);
    await redisCache.invalidatePattern('dest:*');
    logger.info('Destination created and cache invalidated', { destinationId: destination._id });

    res.status(201).json({
      success: true,
      message: 'Destination created successfully.',
      destination,
    });
  } catch (error) {
    next(error);
  }
}

async function updateDestination(req, res, next) {
  try {
    const destination = await Destination.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!destination) {
      return next(new AppError('Destination not found.', 404));
    }

    await redisCache.invalidatePattern('dest:*');
    logger.info('Destination updated and cache invalidated', { destinationId: destination._id });

    res.status(200).json({
      success: true,
      message: 'Destination updated successfully.',
      destination,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteDestination(req, res, next) {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);
    if (!destination) {
      return next(new AppError('Destination not found.', 404));
    }

    await redisCache.invalidatePattern('dest:*');
    logger.info('Destination deleted and cache invalidated', { destinationId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Destination deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
};
