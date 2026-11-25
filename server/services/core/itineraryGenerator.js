const { allocateDaysByDestination, calculateTripBudget } = require('./budgetCalculator');

const PACE_SLOTS_PER_DAY = {
  relaxed: 2,
  balanced: 3,
  packed: 4,
};

/**
 * Generates a structured day-wise itinerary tailored to destinations,
 * user interests, travel pace, start date, custom duration, and budget tier.
 * Prevents duplicate attraction recommendations across days.
 */
function generateDynamicItinerary({
  trip,
  destinations,
}) {
  const customDaysMap = {};
  (trip.destinations || []).forEach((item) => {
    const id = item.destinationId?._id || item.destinationId;
    if (id && item.customDays) {
      customDaysMap[String(id)] = item.customDays;
    }
  });

  const allocations = allocateDaysByDestination(
    destinations,
    trip.duration,
    trip.travelPace || 'balanced',
    customDaysMap
  );

  const userInterests = new Set((trip.interests || []).map((i) => i.toLowerCase()));
  const pace = trip.travelPace || 'balanced';
  const maxAttractionsPerDay = PACE_SLOTS_PER_DAY[pace] || 3;
  const startDate = new Date(trip.startDate || Date.now());

  const budgetEstimate = calculateTripBudget({
    destinations,
    startingCity: trip.startingCity,
    travellers: trip.travellers,
    children: trip.children,
    duration: trip.duration,
    customDaysMap,
    accommodationPreference: trip.accommodationPreference,
    transportPreference: trip.transportPreference,
    travelPace: pace,
    targetBudget: trip.budget?.targetMax ?? 0,
  });

  const days = [];
  let currentDayNumber = 1;

  allocations.forEach((alloc, destIndex) => {
    const { destination: dest, days: destDays } = alloc;
    const usedAttractionNames = new Set();

    // Rank attractions by matching user travel interests first
    const sortedAttractions = [...(dest.attractions || [])].sort((a, b) => {
      const aMatch = userInterests.has(String(a.category).toLowerCase()) ? 1 : 0;
      const bMatch = userInterests.has(String(b.category).toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });

    const destCostEntry = budgetEstimate.destinationBreakdown.find(
      (b) => String(b.destinationId) === String(dest._id)
    );
    const perDayMin = destCostEntry
      ? Math.round(
          (destCostEntry.accommodation.min +
            destCostEntry.food.min +
            destCostEntry.localTransport.min +
            destCostEntry.activities.min) /
            Math.max(1, destDays)
        )
      : 2500;
    const perDayMax = destCostEntry
      ? Math.round(
          (destCostEntry.accommodation.max +
            destCostEntry.food.max +
            destCostEntry.localTransport.max +
            destCostEntry.activities.max) /
            Math.max(1, destDays)
        )
      : 5000;

    for (let d = 0; d < destDays; d += 1) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + (currentDayNumber - 1));

      const morning = [];
      const afternoon = [];
      const evening = [];
      const suggestedAttractions = [];

      // Pick unused attractions for this destination day
      const candidates = sortedAttractions.filter((attr) => !usedAttractionNames.has(attr.name));
      const picked = candidates.slice(0, maxAttractionsPerDay);

      if (d === 0 && destIndex === 0) {
        morning.push({
          title: `Arrival & Check-in at ${dest.name}`,
          category: 'logistics',
          description: `Arrive from ${trip.startingCity || 'origin'} and settle into your ${trip.accommodationPreference || 'moderate'} stay.`,
          durationHours: 1.5,
          estimatedFeeMin: 0,
          estimatedFeeMax: 0,
        });
      } else if (d === 0 && destIndex > 0) {
        const prevDest = allocations[destIndex - 1].destination;
        morning.push({
          title: `Intercity Transit: ${prevDest.name} to ${dest.name}`,
          category: 'transit',
          description: `Travel via ${String(trip.transportPreference || 'private_cab').replace('_', ' ')} and check in.`,
          durationHours: 3,
          estimatedFeeMin: 0,
          estimatedFeeMax: 0,
        });
      }

      picked.forEach((attr) => {
        usedAttractionNames.add(attr.name);
        suggestedAttractions.push(attr.name);
        const item = {
          title: attr.name,
          category: attr.category,
          description: attr.description,
          durationHours: attr.durationHours || 2,
          estimatedFeeMin: attr.entryFeeMin || 0,
          estimatedFeeMax: attr.entryFeeMax || 0,
        };

        if (attr.preferredSlot === 'morning' && morning.length < 2) {
          morning.push(item);
        } else if (attr.preferredSlot === 'afternoon' && afternoon.length < 2) {
          afternoon.push(item);
        } else if (attr.preferredSlot === 'evening' && evening.length < 2) {
          evening.push(item);
        } else if (morning.length === 0) {
          morning.push(item);
        } else if (afternoon.length < 2) {
          afternoon.push(item);
        } else {
          evening.push(item);
        }
      });

      // Fill empty key slots with contextual heritage/cuisine exploration without duplicating attractions
      if (morning.length === 0) {
        morning.push({
          title: `${dest.name} Heritage Walk & Local Breakfast`,
          category: 'culture',
          description: `Leisurely morning stroll through ${dest.region} neighbourhoods and local breakfast.`,
          durationHours: 2,
          estimatedFeeMin: 0,
          estimatedFeeMax: 150,
        });
      }
      if (afternoon.length === 0) {
        afternoon.push({
          title: `${dest.name} Crafts & Regional Cuisine Break`,
          category: 'culture',
          description: `Explore regional handicrafts and enjoy authentic Rajasthani lunch at ${dest.name}.`,
          durationHours: 2,
          estimatedFeeMin: 0,
          estimatedFeeMax: 200,
        });
      }
      if (evening.length === 0) {
        evening.push({
          title: `Sunset Bazaar & Dinner in ${dest.name}`,
          category: 'shopping',
          description: `Relaxed evening walk through local markets and dinner.`,
          durationHours: 2,
          estimatedFeeMin: 0,
          estimatedFeeMax: 200,
        });
      }

      const matchedInterestNote =
        userInterests.size > 0
          ? `Prioritized for interests: ${[...userInterests].join(', ')}.`
          : `Balanced ${dest.region} sightseeing schedule.`;

      days.push({
        dayNumber: currentDayNumber,
        date: dayDate,
        destination: dest._id,
        destinationName: dest.name,
        activities: { morning, afternoon, evening },
        suggestedAttractions,
        estimatedCost: {
          min: perDayMin,
          max: perDayMax,
        },
        notes:
          d === destDays - 1 && destIndex === allocations.length - 1
            ? `${matchedInterestNote} Wrap up souvenirs before departure.`
            : matchedInterestNote,
      });

      currentDayNumber += 1;
    }
  });

  return {
    days,
    totalDuration: days.length,
    budgetEstimate,
  };
}

module.exports = { generateDynamicItinerary };
