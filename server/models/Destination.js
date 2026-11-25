const mongoose = require('mongoose');

const minMaxSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const attractionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['heritage', 'nature', 'spiritual', 'wildlife', 'adventure', 'culture', 'shopping', 'lake'],
    },
    preferredSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      default: 'morning',
    },
    durationHours: { type: Number, default: 2, min: 0.5, max: 12 },
    entryFeeMin: { type: Number, default: 0, min: 0 },
    entryFeeMax: { type: Number, default: 0, min: 0 },
    isSharedVehicle: { type: Boolean, default: false },
    vehicleCapacity: { type: Number, default: 6, min: 1 },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    description: { type: String, required: true },
  },
  { _id: true }
);

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      default: 'Rajasthan',
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: 'India',
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one image URL is required',
      },
    },
    attractions: [attractionSchema],
    coordinates: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 },
    },
    interests: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one travel interest is required',
      },
    },
    recommendedDays: {
      type: Number,
      required: true,
      min: [1, 'Recommended days must be at least 1'],
      max: [14, 'Recommended days cannot exceed 14'],
    },
    bestSeason: {
      type: String,
      required: true,
      enum: ['Winter (Oct-Mar)', 'Monsoon (Jul-Sep)', 'Autumn-Spring (Sep-Apr)', 'Year-round'],
    },
    accommodation: {
      economical: { type: minMaxSchema, required: true },
      moderate: { type: minMaxSchema, required: true },
      premium: { type: minMaxSchema, required: true },
    },
    food: {
      economical: { type: minMaxSchema, required: true },
      moderate: { type: minMaxSchema, required: true },
      premium: { type: minMaxSchema, required: true },
    },
    localTransport: {
      public: {
        min: { type: Number, required: true, min: 0 },
        max: { type: Number, required: true, min: 0 },
        unit: { type: String, default: 'per_person_per_day' },
      },
      private_cab: {
        min: { type: Number, required: true, min: 0 },
        max: { type: Number, required: true, min: 0 },
        unit: { type: String, default: 'per_vehicle_per_day' },
      },
      self_drive: {
        min: { type: Number, required: true, min: 0 },
        max: { type: Number, required: true, min: 0 },
        unit: { type: String, default: 'per_vehicle_per_day' },
      },
    },
    activities: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
      safariPerVehicleMin: { type: Number, default: 0, min: 0 },
      safariPerVehicleMax: { type: Number, default: 0, min: 0 },
      safariVehicleCapacity: { type: Number, default: 6, min: 1 },
    },
    intercity: {
      publicPerPerson: { type: minMaxSchema, required: true },
      cabPerVehicle: { type: minMaxSchema, required: true },
      selfDrivePerVehicle: { type: minMaxSchema, required: true },
      notes: { type: String, default: 'Indicative planning estimate between Rajasthan hubs' },
    },
    averageRating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound & text indexes for fast search, filter, and sorting
destinationSchema.index({ state: 1, region: 1, bestSeason: 1 });
destinationSchema.index({ recommendedDays: 1, 'accommodation.moderate.min': 1 });
destinationSchema.index({ interests: 1 });
destinationSchema.index({ name: 'text', description: 'text', region: 'text', interests: 'text' });

module.exports = mongoose.model('Destination', destinationSchema);
