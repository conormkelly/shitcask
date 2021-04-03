// Main entry point for starting the server

// Constants
const VERSION = process.env.npm_package_version;

// Dependencies
const express = require('express');
const app = express();
const SocketServer = require('./socket');

const logger = require('./logger');
const configSchema = require('./validator/config/schema');
const config = require('./config');

logger.info(`*** Shitcask Server (v${VERSION}) ***`);

logger.info('Validating environment config...');
if (config.errors.length > 0) {
  for (const err of config.errors) {
    logger.error(err.message);
  }
  logger.error('Invalid environment config. Exiting.');
  process.exit(1);
}

logger.info('Displaying config values:');
for (const prop of Object.keys(configSchema.properties)) {
  const value = config[prop];
  const isRequired = configSchema.required.includes(prop);

  // Only log required or (optional and valued) props
  if (isRequired || (!isRequired && value !== undefined)) {
    const valueToLog = configSchema.properties[prop].isSensitive
      ? // Redact value with asterisks if isSensitive in schema
        `${value}`.replace(/./g, '*')
      : // Add ' (default)' if value is the schema default
      value === configSchema.properties[prop].default
      ? `${value} (default)`
      : value;

    logger.info(`${prop}: ${valueToLog}`);
  }
}

// Configure express then:
const socketServer = new SocketServer(app, config);

logger.info('StorageEngine: Initializing...');
const storageEngine = require('./engine/core').initialize();
const { validateGetArgs, validateSetArgs } = require('./validator/req');

logger.info('Server: Configuring listeners...');
// Handle GET and SET operations

socketServer.addConnectionListener((socket) => {
  // TODO: check if client 'secure' config matches server?
  logger.debug(`Socket secure? ${socket.handshake.secure}`);

  logger.info(`Connected: ${socket.id}`);
  socket.on('set', async (req, res) => {
    try {
      const errorMessage = validateSetArgs(req);

      if (!errorMessage) {
        await storageEngine.set(req.key, req.value);
        return res({ success: true });
      } else {
        return res({ success: false, message: errorMessage });
      }
    } catch (err) {
      logger.error(`${socket.id}: SET error ${err.message}`);
      res({ success: false, message: 'Failed to set value.' });
    }
  });
  socket.on('get', async (req, res) => {
    try {
      const errorMessage = validateGetArgs(req);

      if (!errorMessage) {
        const value = await storageEngine.get(req.key);
        return res({ success: true, value: value });
      } else {
        return res({ success: false, message: errorMessage });
      }
    } catch (err) {
      logger.error(`${socket.id}: GET error ${err.message}`);
      res({ success: false, message: 'Failed to get value.' });
    }
  });
  socket.on('disconnect', () => {
    logger.info(`Disconnected: ${socket.id}`);
  });
});

// Listen when storageEngine is ready
storageEngine.on('ready', () => {
  logger.info('StorageEngine: READY');
  socketServer.listen(() => {
    logger.info(`Server: Listening on ${config.DB_SERVER_PORT}.`);
  });
});
