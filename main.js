// Configure server
const http = require('http').createServer();
const io = require('socket.io')(http);

// Init storageEngine
const config = require('./config');
const storageEngine = config.initialize();
const { validateGetArgs, validateSetArgs } = require('./validator');

// Handle GET and SET operations
io.on('connection', (socket) => {
  console.log('A user connected...');
  socket.on('set', async (req, cb) => {
    try {
      validateSetArgs(req);
      await storageEngine.set(req.key, req.value);
      cb({ success: true });
    } catch (err) {
      console.log(err);
      cb({ success: false, message: err.message });
    }
  });
  socket.on('get', async (req, cb) => {
    try {
      validateGetArgs(req);
      const value = await storageEngine.get(req.key);
      cb({ success: true, value: value });
    } catch (err) {
      console.log(err);
      cb({ success: false, message: err.message });
    }
  });
});

// Listen when storageEngine is ready
storageEngine.on('ready', () => {
  console.log('storageEngine: READY');
  http.listen(8081, () => {
    console.log('Listening on', 8081);
  });
});
