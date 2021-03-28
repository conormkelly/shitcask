const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

const logger = createLogger({
  level: 'debug',
  format: combine(timestamp(), colorize()),
  transports: [
    new transports.Console({
      format: printf(({ level, message, timestamp }) => {
        return `${timestamp} - ${level}: ${message}`;
      })
    })
  ]
});

module.exports = logger;
