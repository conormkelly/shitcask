// Module under test
const {
  validateGetArgs,
  validateSetArgs
} = require('../../server/validator/req');
const schema = require('../../server/validator/req/schemas');

// Constants
const ERR_MESSAGES = {
  get: schema.get.errorMessage,
  set: schema.set.errorMessage
};

describe('Request Validator [UNIT]', () => {
  describe('validateGetArgs()', () => {
    test('no error for valid request', () => {
      const req = { key: 'test' };
      const errorMessage = validateGetArgs(req);
      expect(errorMessage).toEqual(null);
    });

    test('correct error if key is incorrect type', () => {
      const req = { key: null };
      const errorMessage = validateGetArgs(req);
      expect(errorMessage).toEqual(ERR_MESSAGES.get.properties.key);
    });

    test('correct error if key is missing', () => {
      const req = {};
      const errorMessage = validateGetArgs(req);
      expect(errorMessage).toEqual(ERR_MESSAGES.get.required);
    });

    test('correct error if additional properties provided', () => {
      const req = { key: 'valid', shouldntBeHere: true };
      const errorMessage = validateGetArgs(req);
      expect(errorMessage).toEqual(ERR_MESSAGES.get.additionalProperties);
    });

    test('validates overall type', () => {
      const req = [1, 2, 3];
      const errorMessage = validateGetArgs(req);
      expect(errorMessage).toEqual(ERR_MESSAGES.get.type);
    });
  });

  describe('validateSetArgs()', () => {
    let req;
    beforeEach(() => {
      // A complete valid config that we can modify as needed per test case.
      req = {
        key: 'test',
        value: 'test'
      };
    });

    test('no error for valid request', () => {
      const errorMessage = validateSetArgs(req);
      expect(errorMessage).toEqual(null);
    });

    test('correct error if key is incorrect type', () => {
      req = { key: null, value: 'test' };
      const errorMessage = validateSetArgs(req);
      expect(errorMessage).toEqual(ERR_MESSAGES.set.properties.key);
    });

    test('correct error if key is missing', () => {
      req = { value: 'test' };
      const errorMessage = validateSetArgs(req);
      expect(errorMessage).toEqual(ERR_MESSAGES.set.required);
    });

    test('correct error if additional properties provided', () => {
      req = { key: 'valid', value: 'valid', shouldntBeHere: true };
      const errorMessage = validateSetArgs(req);
      expect(errorMessage).toEqual(ERR_MESSAGES.set.additionalProperties);
    });

    test('validates overall type', () => {
      req = [1, 2, 3];
      const errorMessage = validateSetArgs(req);
      expect(errorMessage).toEqual(ERR_MESSAGES.set.type);
    });
  });
});
