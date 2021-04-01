// Centralized config

const validateConfig = require('./validator/config');

// Get env vars values
const config = {
  DB_DATA_DIR: process.env.DB_DATA_DIR,
  DB_SERVER_PORT: process.env.DB_SERVER_PORT,
  DB_USE_MEMFS: process.env.DB_USE_MEMFS,
  READ_BUFFER_BYTE_SIZE: process.env.READ_BUFFER_BYTE_SIZE
};

// Errors are checked in main
const errors = validateConfig(config);

module.exports = {
  // Defaults set here for optional values
  DB_DATA_DIR: config.DB_DATA_DIR,
  DB_SERVER_PORT: config.DB_SERVER_PORT ?? 8091,
  DB_USE_MEMFS: config.DB_USE_MEMFS ?? false,
  READ_BUFFER_BYTE_SIZE: config.READ_BUFFER_BYTE_SIZE ?? 16384,
  errors
};
