/**
 * TripNexo Budget Estimation Engine (Indicative Planning Estimates in INR).
 * Separates per-person, per-vehicle, per-room-night, and shared-safari units cleanly.
 */

const PACE_MULTIPLIER = {
  relaxed: 0.75,
  balanced: 1.0,
  packed: 1.25,
};

function roundCurrency(value) {
  return Math.max(0, Math.round(value));
}

function allocateDaysByDestination(destinations, requestedDays, travelPace = 'balanced', customDaysMap = {}) {
  const validDestinations = (destinations || []).filter(Boolean);
  if (!validDestinations.length) return [];

  const paceFactor = travelPace === 'relaxed' ? 1.2 : travelPace === 'packed' ? 0.8 : 1.0;
  const rawWeights = validDestinations.map((dest) => {
    const custom = customDaysMap[String(dest._id)];
    if (custom && Number(custom) >= 1) {
      return Number(custom);
    }
    return Math.max(1, Math.round((dest.recommendedDays || 2) * paceFactor));
  });

  const totalDays = Math.max(1, Number(requestedDays) || rawWeights.reduce((a, b) => a + b, 0));
  const totalWeight = rawWeights.reduce((a, b) => a + b, 0);

  const allocations = validDestinations.map((dest, idx) => {
    const custom = customDaysMap[String(dest._id)];
    if (custom && Number(custom) >= 1 && !requestedDays) {
      return Number(custom);
    }
    return Math.max(1, Math.round((rawWeights[idx] / totalWeight) * totalDays));
  });

  // Adjust rounding drift so sum matches totalDays when totalDays >= validDestinations.length
  let sum = allocations.reduce((a, b) => a + b, 0);
  if (totalDays >= validDestinations.length) {
    let i = 0;
    while (sum > totalDays && i < 100) {
      const idx = i % allocations.length;
      if (allocations[idx] > 1) {
        allocations[idx] -= 1;
        sum -= 1;
      }
      i += 1;
    }
    let j = 0;
    while (sum < totalDays && j < 100) {
      const idx = j % allocations.length;
      allocations[idx] += 1;
      sum += 1;
      j += 1;
    }
  }

  return validDestinations.map((dest, idx) => ({
    destination: dest,
    days: allocations[idx],
  }));
}

function calculateTripBudget({
  destinations = [],
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
}) {
  if (!Array.isArray(destinations) || destinations.length === 0) {
    return {
      currency: 'INR',
      totalDays: 0,
      nights: 0,
      rooms: 0,
      vehicles: 0,
      totalTravellers: 0,
      breakdown: {
        accommodation: { min: 0, max: 0, unit: 'per_room_per_night' },
        food: { min: 0, max: 0, unit: 'per_person_per_day' },
        localTransport: { min: 0, max: 0, unit: 'mixed' },
        intercityTransport: { min: 0, max: 0, unit: 'per_trip_leg' },
        activities: { min: 0, max: 0, unit: 'per_person_and_shared_vehicle' },
      },
      total: { min: 0, max: 0 },
      perPerson: { min: 0, max: 0 },
      budgetWarning: null,
      assumptions: ['Select at least one destination to generate an estimate.'],
    };
  }

  const adults = Math.max(1, Number(travellers) || 1);
  const childCount = Math.max(0, Number(children) || 0);
  const totalHeadcount = adults + childCount;
  const effectiveFoodGuests = adults + childCount * 0.6;

  const dayAllocations = allocateDaysByDestination(destinations, duration, travelPace, customDaysMap);
  const totalDays = dayAllocations.reduce((acc, item) => acc + item.days, 0);
  const nights =
    nightsOverride !== null && nightsOverride !== undefined
      ? Math.max(0, Number(nightsOverride))
      : totalDays > 1
      ? totalDays - 1
      : 0;

  // Up to 3 travellers per room for initial planning estimation
  const rooms =
    roomsOverride && Number(roomsOverride) >= 1
      ? Number(roomsOverride)
      : Math.ceil(totalHeadcount / 3);

  // Up to 4 travellers per private cab / self-drive vehicle
  const vehicles = Math.ceil(totalHeadcount / 4);

  const accomTier = ['economical', 'moderate', 'premium'].includes(accommodationPreference)
    ? accommodationPreference
    : 'moderate';
  const transportMode = ['public', 'private_cab', 'self_drive'].includes(transportPreference)
    ? transportPreference
    : 'private_cab';
  const paceFactor = PACE_MULTIPLIER[travelPace] || 1.0;

  let accomMin = 0;
  let accomMax = 0;
  let foodMin = 0;
  let foodMax = 0;
  let localMin = 0;
  let localMax = 0;
  let activitiesMin = 0;
  let activitiesMax = 0;
  const destinationBreakdown = [];

  // Distribute nights proportionally across destinations according to allocated days
  let remainingNights = nights;
  dayAllocations.forEach((item, index) => {
    const { destination: dest, days } = item;
    const isLast = index === dayAllocations.length - 1;
    const destNights = isLast
      ? remainingNights
      : Math.min(remainingNights, Math.round((days / totalDays) * nights));
    remainingNights = Math.max(0, remainingNights - destNights);

    // 1. Accommodation: nightly room rate × rooms × nights
    const accomRates = dest.accommodation?.[accomTier] || { min: 1800, max: 3500 };
    const dAccomMin = accomRates.min * rooms * destNights;
    const dAccomMax = accomRates.max * rooms * destNights;

    // 2. Food: per-person daily food cost × effective travellers × days
    const foodRates = dest.food?.[accomTier] || { min: 650, max: 1200 };
    const dFoodMin = foodRates.min * effectiveFoodGuests * days;
    const dFoodMax = foodRates.max * effectiveFoodGuests * days;

    // 3. Local transport: strictly unit-aware (per-person for public, per-vehicle for cab/self-drive)
    const localRates = dest.localTransport?.[transportMode] || {
      min: 1500,
      max: 2400,
      unit: 'per_vehicle_per_day',
    };
    const isPerPersonLocal = localRates.unit === 'per_person_per_day' || transportMode === 'public';
    const dLocalMin = isPerPersonLocal
      ? localRates.min * totalHeadcount * days
      : localRates.min * vehicles * days;
    const dLocalMax = isPerPersonLocal
      ? localRates.max * totalHeadcount * days
      : localRates.max * vehicles * days;

    // 4. Activities: per-person sightseeing + shared safari/jeep vehicles when applicable
    const actRates = dest.activities || { min: 300, max: 900 };
    let dActMin = actRates.min * totalHeadcount * days * paceFactor;
    let dActMax = actRates.max * totalHeadcount * days * paceFactor;

    if (actRates.safariPerVehicleMin > 0) {
      const safariCap = actRates.safariVehicleCapacity || 6;
      const safariVehicles = Math.ceil(totalHeadcount / safariCap);
      dActMin += actRates.safariPerVehicleMin * safariVehicles;
      dActMax += actRates.safariPerVehicleMax * safariVehicles;
    }

    accomMin += dAccomMin;
    accomMax += dAccomMax;
    foodMin += dFoodMin;
    foodMax += dFoodMax;
    localMin += dLocalMin;
    localMax += dLocalMax;
    activitiesMin += dActMin;
    activitiesMax += dActMax;

    destinationBreakdown.push({
      destinationId: dest._id,
      name: dest.name,
      days,
      nights: destNights,
      accommodation: { min: roundCurrency(dAccomMin), max: roundCurrency(dAccomMax) },
      food: { min: roundCurrency(dFoodMin), max: roundCurrency(dFoodMax) },
      localTransport: { min: roundCurrency(dLocalMin), max: roundCurrency(dLocalMax) },
      activities: { min: roundCurrency(dActMin), max: roundCurrency(dActMax) },
    });
  });

  // 5. Intercity transportation (per-person for public, per-vehicle for cab/self-drive)
  let intercityMin = 0;
  let intercityMax = 0;
  const hasArrivalLeg =
    startingCity &&
    destinations[0] &&
    startingCity.trim().toLowerCase() !== destinations[0].name.trim().toLowerCase();
  const intercityLegs = Math.max(0, destinations.length - 1) + (hasArrivalLeg ? 1 : 0);

  if (intercityLegs > 0) {
    destinations.forEach((dest, idx) => {
      if (idx === 0 && !hasArrivalLeg) return;
      const ic = dest.intercity || {
        publicPerPerson: { min: 300, max: 700 },
        cabPerVehicle: { min: 2800, max: 4500 },
        selfDrivePerVehicle: { min: 2000, max: 3200 },
      };
      if (transportMode === 'public') {
        intercityMin += ic.publicPerPerson.min * totalHeadcount;
        intercityMax += ic.publicPerPerson.max * totalHeadcount;
      } else if (transportMode === 'self_drive') {
        intercityMin += ic.selfDrivePerVehicle.min * vehicles;
        intercityMax += ic.selfDrivePerVehicle.max * vehicles;
      } else {
        intercityMin += ic.cabPerVehicle.min * vehicles;
        intercityMax += ic.cabPerVehicle.max * vehicles;
      }
    });
  }

  const totalMin = roundCurrency(accomMin + foodMin + localMin + intercityMin + activitiesMin);
  const totalMax = roundCurrency(accomMax + foodMax + localMax + intercityMax + activitiesMax);

  const perPersonMin = roundCurrency(totalMin / totalHeadcount);
  const perPersonMax = roundCurrency(totalMax / totalHeadcount);

  const target = Number(targetBudget) || 0;
  let budgetWarning = null;
  if (target > 0 && totalMax > target) {
    const overAmount = roundCurrency(totalMax - target);
    budgetWarning = {
      exceeded: true,
      overBy: overAmount,
      message: `Estimated upper range (₹${totalMax.toLocaleString('en-IN')}) exceeds your target budget (₹${target.toLocaleString('en-IN')}) by ₹${overAmount.toLocaleString('en-IN')}. Consider adjusting accommodation tier, pace, or duration.`,
    };
  }

  const assumptions = [
    `Room sharing: ${rooms} room(s) assumed for ${totalHeadcount} traveller(s) (up to 3 people per room) across ${nights} night(s).`,
    `Food: ${accomTier} daily per-person dining estimate applied to ${adults} adult(s)${childCount ? ` and ${childCount} child(ren) at 0.6x meal portion` : ''} for ${totalDays} day(s).`,
    transportMode === 'public'
      ? `Local & intercity transport: calculated per person for ${totalHeadcount} traveller(s) using public rail/bus/auto estimates across ${intercityLegs} intercity leg(s).`
      : `Local & intercity transport: calculated per vehicle (${vehicles} vehicle(s) at up to 4 people/vehicle) for ${transportMode.replace('_', ' ')} across ${intercityLegs} intercity leg(s).`,
    `Activities & safaris: scaled by ${travelPace} pace (${paceFactor}x); shared safari/jeep fees split by vehicle capacity (typically 4–6 seats/vehicle). All figures are indicative planning estimates, not live quotations.`,
  ];

  return {
    currency: 'INR',
    isIndicative: true,
    totalDays,
    nights,
    rooms,
    vehicles,
    totalTravellers: totalHeadcount,
    intercityLegs,
    preferences: {
      accommodationPreference: accomTier,
      transportPreference: transportMode,
      travelPace,
    },
    breakdown: {
      accommodation: {
        min: roundCurrency(accomMin),
        max: roundCurrency(accomMax),
        unit: 'per_room_per_night',
      },
      food: {
        min: roundCurrency(foodMin),
        max: roundCurrency(foodMax),
        unit: 'per_person_per_day',
      },
      localTransport: {
        min: roundCurrency(localMin),
        max: roundCurrency(localMax),
        unit: transportMode === 'public' ? 'per_person_per_day' : 'per_vehicle_per_day',
      },
      intercityTransport: {
        min: roundCurrency(intercityMin),
        max: roundCurrency(intercityMax),
        unit: transportMode === 'public' ? 'per_person_per_leg' : 'per_vehicle_per_leg',
      },
      activities: {
        min: roundCurrency(activitiesMin),
        max: roundCurrency(activitiesMax),
        unit: 'per_person_and_shared_vehicle',
      },
    },
    destinationBreakdown,
    total: { min: totalMin, max: totalMax },
    perPerson: { min: perPersonMin, max: perPersonMax },
    budgetWarning,
    assumptions,
  };
}

module.exports = { calculateTripBudget, allocateDaysByDestination };
