const mongoose = require('mongoose');

const activityItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'sightseeing' },
    description: { type: String, default: '' },
    durationHours: { type: Number, default: 2 },
    estimatedFeeMin: { type: Number, default: 0 },
    estimatedFeeMax: { type: Number, default: 0 },
  },
  { _id: true }
);

const itinerarySchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
    },
    destinationName: {
      type: String,
      required: true,
      trim: true,
    },
    activities: {
      morning: { type: [activityItemSchema], default: [] },
      afternoon: { type: [activityItemSchema], default: [] },
      evening: { type: [activityItemSchema], default: [] },
    },
    suggestedAttractions: {
      type: [String],
      default: [],
    },
    estimatedCost: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    notes: {
      type: String,
      default: '',
      maxlength: 600,
    },
  },
  {
    timestamps: true,
  }
);

itinerarySchema.index({ tripId: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model('Itinerary', itinerarySchema);
