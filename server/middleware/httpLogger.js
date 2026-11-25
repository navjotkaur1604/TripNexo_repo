const morgan = require('morgan');
const { logger } = require('../config/logger');
const env = require('../config/env');

function createHttpLogger(serviceName = 'tripnexo-api') {
  const stream = {
    write: (message) => {
      logger.http ? logger.http(message.trim(), { service: serviceName }) : logger.info(message.trim(), { service: serviceName });
    },
  };

  return morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream,
    skip: () => env.nodeEnv === 'test',
  });
}

module.exports = { createHttpLogger };
