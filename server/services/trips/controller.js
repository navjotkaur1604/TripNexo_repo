const mongoose = require('mongoose');
const Trip = require('../../models/Trip');
const Itinerary = require('../../models/Itinerary');
const Destination = require('../../models/Destination');
const { AppError } = require('../../middleware/auth');
const { generateDynamicItinerary } = require('../core/itineraryGenerator');
const { calculateTripBudget } = require('../core/budgetCalculator');

async function resolveOrderedDestinations(destinationEntries) {
  const orderedIds = destinationEntries.map((item) =>
    String(item.destinationId?._id || item.destinationId || item)
  );
  const docs = await Destination.find({ _id: { $in: orderedIds } }).lean();
  const docMap = new Map(docs.map((d) => [String(d._id), d]));

  const orderedDocs = orderedIds.map((id) => docMap.get(id)).filter(Boolean);
  if (orderedDocs.length === 0) {
    throw new AppError('No valid destinations found for this trip.', 400);
  }
  return orderedDocs;
}

function assertOwnership(trip, user) {
  if (!trip) {
    throw new AppError('Trip not found.', 404);
  }
  if (String(trip.userId) !== String(user._id) && user.role !== 'admin') {
    throw new AppError('Forbidden: you do not own this trip.', 403);
  }
}

async function persistGeneratedItinerary(trip, destinationDocs) {
  const result = generateDynamicItinerary({
    trip,
    destinations: destinationDocs,
  });

  await Itinerary.deleteMany({ tripId: trip._id });

  const itineraryDocs = await Itinerary.insertMany(
    result.days.map((day) => ({
      ...day,
      tripId: trip._id,
    }))
  );

  trip.itinerary = itineraryDocs.map((d) => d._id);
  trip.duration = result.totalDuration;
  trip.estimatedCost = {
    min: result.budgetEstimate.total.min,
    max: result.budgetEstimate.total.max,
    perPersonMin: result.budgetEstimate.perPerson.min,
    perPersonMax: result.budgetEstimate.perPerson.max,
    breakdown: result.budgetEstimate.breakdown,
    assumptions: result.budgetEstimate.assumptions,
  };
  await trip.save();

  return result;
}

async function createTrip(req, res, next) {
  try {
    const {
      tripName,
      startingCity = 'Jaipur',
      destinations,
      startDate,
      travellers = 2,
      children = 0,
      duration,
      travelPace = 'balanced',
      interests = ['heritage', 'culture'],
      accommodationPreference = 'moderate',
      transportPreference = 'private_cab',
      budget = {},
      notes = '',
      status = 'planned',
    } = req.body;

    const normalizedDestinations = destinations.map((entry, index) =>
      typeof entry === 'string'
        ? { destinationId: entry, order: index }
        : {
            destinationId: entry.destinationId,
            customDays: entry.customDays,
            order: entry.order ?? index,
          }
    );

    const orderedDocs = await resolveOrderedDestinations(normalizedDestinations);
    const computedDuration =
      Number(duration) ||
      normalizedDestinations.reduce((acc, d, idx) => {
        const doc = orderedDocs[idx];
        return acc + (Number(d.customDays) || doc?.recommendedDays || 2);
      }, 0);

    const trip = await Trip.create({
      userId: req.user._id,
      tripName: tripName.trim(),
      startingCity: startingCity.trim(),
      destinations: normalizedDestinations,
      startDate: startDate || new Date(),
      travellers: Number(travellers),
      children: Number(children) || 0,
      duration: Math.max(1, computedDuration),
      travelPace,
      interests,
      accommodationPreference,
      transportPreference,
      budget: {
        targetMax: Number(budget.targetMax) || 50000,
      },
      notes,
      status,
    });

    await persistGeneratedItinerary(trip, orderedDocs);

    const populated = await Trip.findById(trip._id)
      .populate('destinations.destinationId', 'name slug region images coordinates recommendedDays')
      .populate({ path: 'itinerary', options: { sort: { dayNumber: 1 } } });

    res.status(201).json({
      success: true,
      message: 'Trip created and itinerary generated successfully.',
      trip: populated,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyTrips(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const [trips, statsAgg] = await Promise.all([
      Trip.find({ userId })
        .sort({ createdAt: -1 })
        .populate('destinations.destinationId', 'name slug region images coordinates recommendedDays')
        .populate({ path: 'itinerary', options: { sort: { dayNumber: 1 } } })
        .lean(),
      Trip.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            upcomingTrips: {
              $sum: {
                $cond: [{ $gte: ['$startDate', new Date()] }, 1, 0],
              },
            },
            totalEstimatedMin: { $sum: '$estimatedCost.min' },
            totalEstimatedMax: { $sum: '$estimatedCost.max' },
          },
        },
      ]),
    ]);

    const stats = statsAgg[0] || {
      totalTrips: 0,
      upcomingTrips: 0,
      totalEstimatedMin: 0,
      totalEstimatedMax: 0,
    };

    res.status(200).json({
      success: true,
      count: trips.length,
      stats,
      trips,
    });
  } catch (error) {
    next(error);
  }
}

async function getTripById(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('destinations.destinationId')
      .populate({ path: 'itinerary', options: { sort: { dayNumber: 1 } } });

    assertOwnership(trip, req.user);

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    next(error);
  }
}

async function updateTrip(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id);
    assertOwnership(trip, req.user);

    const {
      tripName,
      startingCity,
      destinations,
      startDate,
      travellers,
      children,
      duration,
      travelPace,
      interests,
      accommodationPreference,
      transportPreference,
      budget,
      notes,
      status,
      itineraryUpdates,
      regenerate,
    } = req.body;

    if (tripName !== undefined) trip.tripName = tripName.trim();
    if (startingCity !== undefined) trip.startingCity = startingCity.trim();
    if (startDate !== undefined) trip.startDate = startDate;
    if (travellers !== undefined) trip.travellers = Number(travellers);
    if (children !== undefined) trip.children = Number(children);
    if (duration !== undefined) trip.duration = Number(duration);
    if (travelPace !== undefined) trip.travelPace = travelPace;
    if (interests !== undefined) trip.interests = interests;
    if (accommodationPreference !== undefined) trip.accommodationPreference = accommodationPreference;
    if (transportPreference !== undefined) trip.transportPreference = transportPreference;
    if (notes !== undefined) trip.notes = notes;
    if (status !== undefined) trip.status = status;

    if (budget !== undefined) {
      trip.budget = {
        targetMax: budget.targetMax !== undefined ? Number(budget.targetMax) : trip.budget?.targetMax ?? 50000,
      };
    }

    if (Array.isArray(destinations) && destinations.length > 0) {
      trip.destinations = destinations.map((entry, index) =>
        typeof entry === 'string'
          ? { destinationId: entry, order: index }
          : {
              destinationId: entry.destinationId?._id || entry.destinationId,
              customDays: entry.customDays,
              order: entry.order ?? index,
            }
      );
    }

    // Apply granular itinerary day edits if provided
    if (Array.isArray(itineraryUpdates) && itineraryUpdates.length > 0) {
      for (const dayUpdate of itineraryUpdates) {
        if (!dayUpdate._id) continue;
        const updatePayload = {};
        if (dayUpdate.activities) updatePayload.activities = dayUpdate.activities;
        if (dayUpdate.notes !== undefined) updatePayload.notes = dayUpdate.notes;
        await Itinerary.findOneAndUpdate(
          { _id: dayUpdate._id, tripId: trip._id },
          updatePayload,
          { runValidators: true }
        );
      }
    }

    const orderedDocs = await resolveOrderedDestinations(trip.destinations);

    if (regenerate) {
      await persistGeneratedItinerary(trip, orderedDocs);
    } else {
      const customDaysMap = {};
      trip.destinations.forEach((item) => {
        if (item.customDays) customDaysMap[String(item.destinationId)] = item.customDays;
      });
      const budgetEstimate = calculateTripBudget({
        destinations: orderedDocs,
        startingCity: trip.startingCity,
        travellers: trip.travellers,
        children: trip.children,
        duration: trip.duration,
        customDaysMap,
        accommodationPreference: trip.accommodationPreference,
        transportPreference: trip.transportPreference,
        travelPace: trip.travelPace,
        targetBudget: trip.budget?.targetMax ?? 0,
      });

      trip.estimatedCost = {
        min: budgetEstimate.total.min,
        max: budgetEstimate.total.max,
        perPersonMin: budgetEstimate.perPerson.min,
        perPersonMax: budgetEstimate.perPerson.max,
        breakdown: budgetEstimate.breakdown,
        assumptions: budgetEstimate.assumptions,
      };
      await trip.save();
    }

    const populated = await Trip.findById(trip._id)
      .populate('destinations.destinationId')
      .populate({ path: 'itinerary', options: { sort: { dayNumber: 1 } } });

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully.',
      trip: populated,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteTrip(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id);
    assertOwnership(trip, req.user);

    await Itinerary.deleteMany({ tripId: trip._id });
    await Trip.findByIdAndDelete(trip._id);

    res.status(200).json({
      success: true,
      message: 'Trip and associated itinerary deleted.',
    });
  } catch (error) {
    next(error);
  }
}

async function regenerateTripItinerary(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id);
    assertOwnership(trip, req.user);

    // Optional overrides during regeneration
    if (req.body.duration) trip.duration = Number(req.body.duration);
    if (req.body.travelPace) trip.travelPace = req.body.travelPace;
    if (Array.isArray(req.body.interests)) trip.interests = req.body.interests;

    const orderedDocs = await resolveOrderedDestinations(trip.destinations);
    await persistGeneratedItinerary(trip, orderedDocs);

    const populated = await Trip.findById(trip._id)
      .populate('destinations.destinationId')
      .populate({ path: 'itinerary', options: { sort: { dayNumber: 1 } } });

    res.status(200).json({
      success: true,
      message: 'Itinerary regenerated dynamically.',
      trip: populated,
    });
  } catch (error) {
    next(error);
  }
}

async function duplicateTrip(req, res, next) {
  try {
    const sourceTrip = await Trip.findById(req.params.id).lean();
    assertOwnership(sourceTrip, req.user);

    const sourceItineraries = await Itinerary.find({ tripId: sourceTrip._id })
      .sort({ dayNumber: 1 })
      .lean();

    const clonedTrip = await Trip.create({
      userId: req.user._id,
      tripName: `${sourceTrip.tripName} (Copy)`,
      startingCity: sourceTrip.startingCity,
      destinations: sourceTrip.destinations,
      startDate: sourceTrip.startDate,
      travellers: sourceTrip.travellers,
      children: sourceTrip.children,
      duration: sourceTrip.duration,
      travelPace: sourceTrip.travelPace,
      interests: sourceTrip.interests,
      accommodationPreference: sourceTrip.accommodationPreference,
      transportPreference: sourceTrip.transportPreference,
      budget: {
        targetMax: sourceTrip.budget?.targetMax ?? 50000,
      },
      notes: sourceTrip.notes,
      estimatedCost: sourceTrip.estimatedCost,
      status: 'draft',
    });

    if (sourceItineraries.length > 0) {
      const clonedDays = await Itinerary.insertMany(
        sourceItineraries.map(({ _id, createdAt, updatedAt, __v, ...rest }) => ({
          ...rest,
          tripId: clonedTrip._id,
        }))
      );
      clonedTrip.itinerary = clonedDays.map((d) => d._id);
      await clonedTrip.save();
    }

    const populated = await Trip.findById(clonedTrip._id)
      .populate('destinations.destinationId', 'name slug region images coordinates recommendedDays')
      .populate({ path: 'itinerary', options: { sort: { dayNumber: 1 } } });

    res.status(201).json({
      success: true,
      message: 'Trip duplicated successfully.',
      trip: populated,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  regenerateTripItinerary,
  duplicateTrip,
};
