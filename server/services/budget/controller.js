const Destination = require('../../models/Destination');
const Trip = require('../../models/Trip');
const { AppError } = require('../../middleware/auth');
const { calculateTripBudget } = require('../core/budgetCalculator');

async function estimateBudget(req, res, next) {
  try {
    const {
      destinationIds = [],
      startingCity = 'Jaipur',
      travellers = 2,
      children = 0,
      duration = null,
      customDaysMap = {},
      accommodationPreference = 'moderate',
      transportPreference = 'private_cab',
      travelPace = 'balanced',
      targetBudget = 0,
      roomsOverride = null,
      nightsOverride = null,
    } = req.body;

    if (!Array.isArray(destinationIds) || destinationIds.length === 0) {
      return next(new AppError('Select at least one destination to calculate a budget.', 400));
    }

    const docs = await Destination.find({ _id: { $in: destinationIds } }).lean();
    const docMap = new Map(docs.map((d) => [String(d._id), d]));
    const orderedDestinations = destinationIds.map((id) => docMap.get(String(id))).filter(Boolean);

    if (orderedDestinations.length === 0) {
      return next(new AppError('No matching destinations found in database.', 404));
    }

    const baseParams = {
      destinations: orderedDestinations,
      startingCity,
      travellers,
      children,
      duration,
      customDaysMap,
      accommodationPreference,
      transportPreference,
      travelPace,
      targetBudget,
      roomsOverride,
      nightsOverride,
    };

    const estimate = calculateTripBudget(baseParams);

    // Provide tier comparison for transparent planning decisions
    const tierComparison = ['economical', 'moderate', 'premium'].map((tier) => {
      const tierCalc = calculateTripBudget({
        ...baseParams,
        accommodationPreference: tier,
      });
      return {
        tier,
        totalMin: tierCalc.total.min,
        totalMax: tierCalc.total.max,
        perPersonMin: tierCalc.perPerson.min,
        perPersonMax: tierCalc.perPerson.max,
      };
    });

    res.status(200).json({
      success: true,
      estimate,
      tierComparison,
    });
  } catch (error) {
    next(error);
  }
}

async function getTripBudget(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('destinations.destinationId');
    if (!trip) {
      return next(new AppError('Trip not found.', 404));
    }
    if (String(trip.userId) !== String(req.user._id) && req.user.role !== 'admin') {
      return next(new AppError('Forbidden: you do not own this trip.', 403));
    }

    const orderedDestinations = trip.destinations
      .map((item) => item.destinationId)
      .filter(Boolean);

    const customDaysMap = {};
    trip.destinations.forEach((item) => {
      if (item.destinationId && item.customDays) {
        customDaysMap[String(item.destinationId._id)] = item.customDays;
      }
    });

    const estimate = calculateTripBudget({
      destinations: orderedDestinations,
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
      min: estimate.total.min,
      max: estimate.total.max,
      perPersonMin: estimate.perPerson.min,
      perPersonMax: estimate.perPerson.max,
      breakdown: estimate.breakdown,
      assumptions: estimate.assumptions,
    };
    await trip.save();

    res.status(200).json({
      success: true,
      tripId: trip._id,
      tripName: trip.tripName,
      estimate,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { estimateBudget, getTripBudget };
