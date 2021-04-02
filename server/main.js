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
      ? // Redact value with asterisks if iSensitive in schema
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
    logger.info(`Client connection attempt: ${socket.id}`);

    const { auth } = socket.handshake;
    if (
      auth.username === config.DB_USERNAME &&
      auth.password === config.DB_PASSWORD
    ) {
      next();
    } else {
      // Generates connect_failed event on the client
      const err = new Error(
        'Invalid username / password combination provided.'
      );
      err.data = { code: 'AUTH_FAILED' };
      next(err);
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
  logger.info(`Client connected: ${socket.id}`);
  socket.on('set', async (req, res) => {
    try {
      validateSetArgs(req);
      await storageEngine.set(req.key, req.value);
      res({ success: true });
    } catch (err) {
      logger.warn(`SetError (${socket.id}) : ${err.message}`);
      res({ success: false, message: err.message });
    }
  });
  socket.on('get', async (req, res) => {
    try {
      validateGetArgs(req);
      const value = await storageEngine.get(req.key);
      res({ success: true, value: value });
    } catch (err) {
      logger.warn(`GetError (${socket.id}) : ${err.message}`);
      res({ success: false, message: err.message });
    }
  });
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Listen when storageEngine is ready
storageEngine.on('ready', () => {
  logger.info('StorageEngine: READY');
  server.listen(config.DB_SERVER_PORT, () => {
    logger.info(`Server: Listening on ${config.DB_SERVER_PORT}.`);
  });
});
