// Import schemas
const schemas = require('./schemas');

// Import and instantiate Ajv
const Ajv = require('ajv').default;
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

// Add ajv-errors
const ajvErrors = require('ajv-errors');
ajvErrors(ajv);

// Compile the schemas into validators
const getValidator = ajv.compile(schemas.get);
const setValidator = ajv.compile(schemas.set);

/**
 * Generates a function that applies the validator,
 * and throws an error message (defined in the schema) if it's invalid.
 * @param {Function} validator
 * @returns {Function}
 */
const createValidator = (validator) => {
  return function validate (req) {
    if (!validator(req)) {
      const [error] = validator.errors;
      throw new Error(error.message);
    }
  };
};

module.exports = {
  validateGetArgs: createValidator(getValidator),
  validateSetArgs: createValidator(setValidator)
};
