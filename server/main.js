const config = require('./config');
const logger = require('./logger');

const validateConfig = require('./validator/config');

// Validate config
const errors = validateConfig(config);
if (errors.length > 0) {
  for (const err of errors) {
    logger.error(err.message);
  }
  logger.error('Invalid config - exiting');
  process.exit(1);
}

// Log config values
// TODO: redact secret values
for (const key of Object.keys(config)) {
  logger.info(`${key}: ${config[key]}`);
}

// Create server
// TODO: http / https
const http = require('http').createServer();
const io = require('socket.io')(http);

// Init storageEngine
const storageEngine = require('./engine/core').initialize();
const { validateGetArgs, validateSetArgs } = require('./validator/req');

// Handle GET and SET operations
io.on('connection', (socket) => {
  logger.info(`Client connected - ID: ${socket.id}`);
  socket.on('set', async (req, callback) => {
    try {
      validateSetArgs(req);
      await storageEngine.set(req.key, req.value);
      callback({ success: true });
    } catch (err) {
      logger.warn(`SetError (${socket.id}) : ${err.message}`);
      callback({ success: false, message: err.message });
    }
  });
  socket.on('get', async (req, callback) => {
    try {
      validateGetArgs(req);
      const value = await storageEngine.get(req.key);
      callback({ success: true, value: value });
    } catch (err) {
      logger.warn(`GetError (${socket.id}) : ${err.message}`);
      callback({ success: false, message: err.message });
    }
  });
});

// Listen when storageEngine is ready
const { DB_SERVER_PORT } = config;
storageEngine.on('ready', () => {
  logger.info('StorageEngine: READY');
  http.listen(DB_SERVER_PORT, () => {
    logger.info(`Server: Listening on ${DB_SERVER_PORT}`);
  });
});
