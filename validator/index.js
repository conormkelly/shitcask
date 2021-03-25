// Import schemas
const schemas = require('./schemas');

// Import and instantiate Ajv
const Ajv = require('ajv').default;
const ajv = new Ajv();

// Compile the schemas into validators
const getValidator = ajv.compile(schemas.get);
const setValidator = ajv.compile(schemas.set);

/**
 * Generates a function that applies the validator,
 * and throws error with errorMessage if it's invalid.
 * @param {*} validator
 * @param {*} errorMessage
 * @returns
 */
const createValidator = (validator, errorMessage) => {
  return function validate(req) {
    const isValid = validator(req);
    if (!isValid) {
      throw new Error(errorMessage);
    }
  };
};

module.exports = {
  validateGetArgs: createValidator(getValidator, 'Expected: { key }'),
  validateSetArgs: createValidator(setValidator, 'Expected: { key, value }'),
};
