// Init storageEngine
const config = require('./config');
const storageEngine = config.initialize();

// Configure express
const express = require('express');
const app = express();

app.use(express.json());

// Handle malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    res.status(400).json({ message: 'Bad request body' });
  } else {
    next();
  }
});

// Handle GET and SET operations
app.post('/', async (req, res, next) => {
  try {
    const { key, value } = req.body;

    // Both key and value == SET
    if (key !== undefined && value !== undefined) {
      await storageEngine.set(key, value);
      return res.status(200).json(true);
    } else if (key !== undefined && value == undefined) {
      // ONLY key == GET
      const value = await storageEngine.get(key);
      return res.status(200).json(value);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Error' });
  }
});

// DONE configuring express

// Listen when storageEngine is ready
storageEngine.on('ready', () => {
  console.log('storageEngine: READY');
  app.listen(8081, () => {
    console.log('Listening on', 8081);
    console.log(
      'Send a POST request with just "key" in body for GET, or both "key" and "value" for SET.'
    );
  });
});
