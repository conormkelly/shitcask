const dotenv = require('dotenv');

// Load .env file into process.env
// Used during local dev only - see README
const error = dotenv.config().error;

if (error) {
  throw error;
}
