// Centralized config
// Values are validated on startup in main.

// Get values of env vars
const { DB_DATA_DIR, DB_SERVER_PORT } = process.env;

module.exports = {
  // Defaults set here for optional values
  DB_DATA_DIR,
  DB_SERVER_PORT: DB_SERVER_PORT || 8081,
};
