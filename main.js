// Configure server
const http = require('http').createServer();
const io = require('socket.io')(http);

// Init storageEngine
const config = require('./config');
const storageEngine = config.initialize();

// Handle GET and SET operations
io.on('connection', (socket) => {
  console.log('A user connected...');
  socket.on('set', async ({ key, value }, cb) => {
    try {
      await storageEngine.set(key, value);
      cb({ success: true });
    } catch (err) {
      console.log(err);
      cb({ success: false, message: err.message });
    }
  });
  socket.on('get', async ({ key }, cb) => {
    try {
      const value = await storageEngine.get(key);
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
