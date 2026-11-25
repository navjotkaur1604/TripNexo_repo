const mongoose = require('mongoose');

const tripDestinationSchema = new mongoose.Schema(
  {
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
    },
    customDays: {
      type: Number,
      min: 1,
      max: 21,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripName: {
      type: String,
      required: [true, 'Trip name is required'],
      trim: true,
      minlength: [2, 'Trip name must be at least 2 characters'],
      maxlength: [120, 'Trip name cannot exceed 120 characters'],
    },
    startingCity: {
      type: String,
      required: [true, 'Starting city is required'],
      trim: true,
      default: 'Jaipur',
    },
    destinations: {
      type: [tripDestinationSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Select at least one destination for your trip',
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    travellers: {
      type: Number,
      required: true,
      min: [1, 'At least 1 adult traveller is required'],
      max: [30, 'Maximum 30 travellers supported'],
      default: 2,
    },
    children: {
      type: Number,
      min: 0,
      max: 20,
      default: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: [1, 'Duration must be at least 1 day'],
      max: [45, 'Duration cannot exceed 45 days'],
    },
    travelPace: {
      type: String,
      enum: ['relaxed', 'balanced', 'packed'],
      default: 'balanced',
    },
    interests: {
      type: [String],
      default: ['heritage', 'culture'],
    },
    accommodationPreference: {
      type: String,
      enum: ['economical', 'moderate', 'premium'],
      default: 'moderate',
    },
    transportPreference: {
      type: String,
      enum: ['public', 'private_cab', 'self_drive'],
      default: 'private_cab',
    },
    budget: {
      targetMax: { type: Number, min: 0, default: 50000 },
    },
    notes: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    itinerary: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Itinerary',
      },
    ],
    estimatedCost: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      perPersonMin: { type: Number, default: 0 },
      perPersonMax: { type: Number, default: 0 },
      breakdown: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      assumptions: {
        type: [String],
        default: [],
      },
    },
    status: {
      type: String,
      enum: ['draft', 'planned', 'upcoming', 'completed'],
      default: 'planned',
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.index({ userId: 1, createdAt: -1 });
tripSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Trip', tripSchema);
