// Main entry point for starting the server

// Constants
const VERSION = process.env.npm_package_version;

// Dependencies
const http = require('http');
const socketIo = require('socket.io');

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

// Create server
logger.info('Server: Creating...');
// TODO: http/https
const server = http.createServer();
const io = socketIo(server);

// Check auth
const AUTH_ENABLED =
  config.DB_USERNAME !== undefined && config.DB_PASSWORD !== undefined;

if (AUTH_ENABLED) {
  logger.info('Auth: ENABLED');
  io.use((socket, next) => {
    logger.info(
      `Authenticating: ${socket.id} (Address: ${socket.handshake.address})`
    );

    const { auth } = socket.handshake;
    if (
      auth.username === config.DB_USERNAME &&
      auth.password === config.DB_PASSWORD
    ) {
      next();
      logger.info(`Authorized: ${socket.id}`);
    } else {
      // Generates connect_failed event on the client
      const err = new Error(
        'Invalid username / password combination provided.'
      );
      err.data = { code: 'AUTH_FAILED' };
      next(err);
      logger.info(`Unauthorized: ${socket.id}`);
    }
  });
} else {
  logger.warn('AUTH: DISABLED');
  logger.warn(
    'AUTH: It is strongly recommended to set DB_USERNAME and DB_PASSWORD.'
  );
}

logger.info('StorageEngine: Initializing...');
const storageEngine = require('./engine/core').initialize();
const { validateGetArgs, validateSetArgs } = require('./validator/req');

logger.info('Server: Configuring listeners...');
// Handle GET and SET operations
io.on('connection', (socket) => {
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
  server.listen(config.DB_SERVER_PORT, () => {
    logger.info(`Server: Listening on ${config.DB_SERVER_PORT}.`);
  });
});
