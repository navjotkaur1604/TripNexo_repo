const mongoose = require('mongoose');
const env = require('./env');
const { logger } = require('./logger');

let isConnected = false;

async function connectDB(uri = env.mongodbUri) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info('MongoDB connected successfully', {
      host: conn.connection.host,
      database: conn.connection.name,
    });
    return conn.connection;
  } catch (error) {
    logger.error('MongoDB connection failed', { message: error.message });
    throw error;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  }
}

module.exports = { connectDB, disconnectDB };
