// Import schema
const schema = require('./schema');

// Import and instantiate Ajv
const Ajv = require('ajv').default;
const ajv = new Ajv({ allErrors: true });

// Add ajv-errors
const ajvErrors = require('ajv-errors');
ajvErrors(ajv);

// Compile the schema into a validator
const validator = ajv.compile(schema);

function validateConfig(config) {
  let errors = [];

  const isValid = validator(config);

  if (!isValid) {
    errors = validator.errors;
  }

  return errors;
}

module.exports = validateConfig;
