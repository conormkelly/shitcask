// Import schema
const schema = require('./schema');

// Import and instantiate Ajv
const Ajv = require('ajv').default;

// Converts types per the schema where possible.
// See: https://ajv.js.org/coercion.html
const ajv = new Ajv({ allErrors: true, coerceTypes: true, useDefaults: true });

// Add ajv-errors
const ajvErrors = require('ajv-errors');
ajvErrors(ajv);

// Allows "isSensitive" keyword to be added to the config properties
// This controls whether the variable is logged at startup.
ajv.addKeyword('isSensitive');

// Compile the schema into a validator
const validator = ajv.compile(schema);

/**
 * Validates the environment variable config against the schema.
 *
 * Also coerces config values into the schema-defined type if valid -
 * e.g. for a boolean property, a string of 'true' is coerced into `true`.
 *
 * The schema-defined default values are set for missing optional values.
 *
 * @param {*} config
 * @returns {{message: string}[]} Validation errors.
 */
function validateConfig (config) {
  let errors = [];

  const isValid = validator(config);
  if (!isValid) {
    errors = validator.errors;
  }
  return errors;
}

module.exports = validateConfig;
