// Import schemas
const schemas = require('./schemas');

// Import and instantiate Ajv
const Ajv = require('ajv').default;
const ajv = new Ajv({ allErrors: true });

// Add ajv-errors
const ajvErrors = require('ajv-errors');
ajvErrors(ajv);

// Compile the schemas into validators
const getValidator = ajv.compile(schemas.get);
const setValidator = ajv.compile(schemas.set);

/**
 * Generates a function that applies the validator and returns an error message if invalid.
 * @param {Function} validator
 * @returns {Function}
 */
const createValidator = (validator) => {
  return function getErrorMessage (req) {
    // If invalid, only a singleError message can be returned per schema config.
    return validator(req) ? null : validator.errors[0].message;
  };
};

module.exports = {
  validateGetArgs: createValidator(getValidator),
  validateSetArgs: createValidator(setValidator)
};
