const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create log directory if not exists
const logDir = '/var/log/ecommerce';
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (e) {
    // fallback to local logs in dev
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      handleExceptions: true
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'app.log')
    })
  ]
});

module.exports = logger;
