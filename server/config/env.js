const path = require('path');
const dotenv = require('dotenv');

// Load root .env if present (Docker/CI may inject env vars directly)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  gatewayPort: Number(process.env.GATEWAY_PORT) || 5000,

  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripnexo',

  jwtSecret: process.env.JWT_SECRET || 'tripnexo_dev_jwt_secret_key_2026_rajasthan_travel_planner',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  redisTtlSeconds: Number(process.env.REDIS_TTL_SECONDS) || 300,

  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:5001',
  destinationServiceUrl: process.env.DESTINATION_SERVICE_URL || 'http://127.0.0.1:5002',
  tripServiceUrl: process.env.TRIP_SERVICE_URL || 'http://127.0.0.1:5003',
  budgetServiceUrl: process.env.BUDGET_SERVICE_URL || 'http://127.0.0.1:5004',

  authServicePort: Number(process.env.AUTH_SERVICE_PORT) || 5001,
  destinationServicePort: Number(process.env.DESTINATION_SERVICE_PORT) || 5002,
  tripServicePort: Number(process.env.TRIP_SERVICE_PORT) || 5003,
  budgetServicePort: Number(process.env.BUDGET_SERVICE_PORT) || 5004,

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  storageDriver: process.env.STORAGE_DRIVER || 'local',
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads'),
  maxFileSizeBytes: (Number(process.env.MAX_FILE_SIZE_MB) || 2) * 1024 * 1024,

  cloudStorage: {
    bucket: process.env.CLOUD_STORAGE_BUCKET || '',
    region: process.env.CLOUD_STORAGE_REGION || 'ap-south-1',
    endpoint: process.env.CLOUD_STORAGE_ENDPOINT || '',
    accessKey: process.env.CLOUD_STORAGE_ACCESS_KEY || '',
    secretKey: process.env.CLOUD_STORAGE_SECRET_KEY || '',
  },
};

module.exports = env;
