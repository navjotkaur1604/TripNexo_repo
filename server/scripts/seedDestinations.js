const { connectDB, disconnectDB } = require('../config/db');
const Destination = require('../models/Destination');
const rajasthanDestinations = require('../data/rajasthanDestinations');
const { logger } = require('../config/logger');

async function seedDestinations({ closeConnection = true } = {}) {
  await connectDB();

  let inserted = 0;
  let updated = 0;

  for (const dest of rajasthanDestinations) {
    const existing = await Destination.findOne({ slug: dest.slug });
    if (existing) {
      await Destination.findByIdAndUpdate(existing._id, dest, { runValidators: true });
      updated += 1;
    } else {
      await Destination.create(dest);
      inserted += 1;
    }
  }

  logger.info('Destination seed completed', {
    total: rajasthanDestinations.length,
    inserted,
    updated,
  });

  if (closeConnection) {
    await disconnectDB();
  }
  return { total: rajasthanDestinations.length, inserted, updated };
}

if (require.main === module) {
  seedDestinations()
    .then((res) => {
      console.log('Seeded Rajasthan destinations:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDestinations };
