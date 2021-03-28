const config = require('./config');
const logger = require('./logger');

logger.info('Validating environment config...');
const validateConfig = require('./validator/config');
const errors = validateConfig(config);
if (errors.length > 0) {
  for (const err of errors) {
    logger.error(err.message);
  }
  logger.error('Invalid environment config. Exiting.');
  process.exit(1);
}

logger.info('Config values:');
for (const key of Object.keys(config)) {
  // TODO: redact secret values
  logger.info(`${key}: ${config[key]}`);
}

// Create server
logger.info('Server: Creating...');
// TODO: http / https
const http = require('http').createServer();
const io = require('socket.io')(http);

logger.info('StorageEngine: Initializing...');
const storageEngine = require('./engine/core').initialize();
const { validateGetArgs, validateSetArgs } = require('./validator/req');

logger.info('Server: Configuring listeners...');
// Handle GET and SET operations
io.on('connection', (socket) => {
  logger.info(`Client connected - ID: ${socket.id}`);
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
});

// Listen when storageEngine is ready
const { DB_SERVER_PORT } = config;
storageEngine.on('ready', () => {
  logger.info('StorageEngine: READY');
  http.listen(DB_SERVER_PORT, () => {
    logger.info(`Server: Listening on ${DB_SERVER_PORT}.`);
  });
});
