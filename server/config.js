// Centralized config

const validateConfig = require('./validator/config');

// Get env vars values
const config = {
  DB_DATA_DIR: process.env.DB_DATA_DIR,
  DB_SERVER_PORT: process.env.DB_SERVER_PORT,
  DB_USE_MEMFS: process.env.DB_USE_MEMFS,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_TLS_KEY_PATH: process.env.DB_TLS_KEY_PATH,
  DB_TLS_CERT_PATH: process.env.DB_TLS_CERT_PATH,
  READ_BUFFER_BYTE_SIZE: process.env.READ_BUFFER_BYTE_SIZE
};

// Validates, type coerces and sets defaults on config -
// as defined in the schema.
const errors = validateConfig(config);

module.exports = {
  ...config,
  errors // Checked in main on startup
};
