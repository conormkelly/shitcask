const logger = require('./logger');

// Configure server
const http = require('http').createServer();
const io = require('socket.io')(http);

// Init storageEngine
const storageEngine = require('.//engine/core').initialize();
const { validateGetArgs, validateSetArgs } = require('./validator');

// Handle GET and SET operations
io.on('connection', (socket) => {
  logger.info(`Client connected - ID: ${socket.id}`);
  socket.on('set', async (req, cb) => {
    try {
      validateSetArgs(req);
      await storageEngine.set(req.key, req.value);
      cb({ success: true });
    } catch (err) {
      logger.warn(`SetError (${socket.id}) : ${err.message}`);
      cb({ success: false, message: err.message });
    }
  });
  socket.on('get', async (req, cb) => {
    try {
      validateGetArgs(req);
      const value = await storageEngine.get(req.key);
      cb({ success: true, value: value });
    } catch (err) {
      logger.warn(`GetError (${socket.id}) : ${err.message}`);
      cb({ success: false, message: err.message });
    }
  });
});

// Listen when storageEngine is ready
const PORT = process.env.DB_SERVER_PORT || 8081;
storageEngine.on('ready', () => {
  logger.info('StorageEngine: READY');
  http.listen(PORT, () => {
    logger.info(`Server: Listening on ${PORT}`);
  });
});
