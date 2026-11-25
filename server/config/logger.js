const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const env = require('./env');

const logsDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmPassword',
  'token',
  'jwt',
  'authorization',
  'secret',
  'jwtSecret',
  'accessKey',
  'secretKey',
]);

/**
 * Redacts sensitive fields recursively so secrets/passwords/JWTs never reach logs.
 */
function redactSensitive(value) {
  if (Array.isArray(value)) {
    return value.map(redactSensitive);
  }
  if (value && typeof value === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key.toLowerCase())) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = redactSensitive(val);
      }
    }
    return clean;
  }
  return value;
}

const redactFormat = format((info) => redactSensitive(info));

const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  redactFormat(),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, service, ...meta }) => {
    const svc = service ? `[${service}] ` : '';
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${svc}${message}${extra}`;
  })
);

const fileFormat = format.combine(
  format.timestamp(),
  redactFormat(),
  format.errors({ stack: true }),
  format.json()
);

function buildLogger(serviceName = 'tripnexo-api') {
  const loggerTransports = [
    new transports.Console({
      silent: env.nodeEnv === 'test',
      format: consoleFormat,
    }),
  ];

  if (env.nodeEnv !== 'test') {
    loggerTransports.push(
      new transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: fileFormat,
      }),
      new transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: fileFormat,
      })
    );
  }

  return createLogger({
    level: env.nodeEnv === 'production' ? 'info' : 'debug',
    defaultMeta: { service: serviceName },
    transports: loggerTransports,
  });
}

const logger = buildLogger('tripnexo-api');

module.exports = { logger, buildLogger, redactSensitive };
