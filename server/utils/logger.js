const config = require('../config');

const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel = config.env === 'production' ? LogLevels.INFO : LogLevels.DEBUG;

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  if (config.env === 'production') {
    return JSON.stringify({ timestamp, level, message, ...meta });
  }
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const colorMap = {
    DEBUG: '\x1b[90m',
    INFO: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
  };
  const color = colorMap[level] || '\x1b[0m';
  return `${color}[${timestamp}] [${level}]\x1b[0m ${message}${metaStr}`;
}

const logger = {
  debug(message, meta) {
    if (currentLevel <= LogLevels.DEBUG) console.log(formatLog('DEBUG', message, meta));
  },
  info(message, meta) {
    if (currentLevel <= LogLevels.INFO) console.log(formatLog('INFO', message, meta));
  },
  warn(message, meta) {
    if (currentLevel <= LogLevels.WARN) console.warn(formatLog('WARN', message, meta));
  },
  error(message, meta) {
    if (currentLevel <= LogLevels.ERROR) console.error(formatLog('ERROR', message, meta));
  },
};

module.exports = logger;
