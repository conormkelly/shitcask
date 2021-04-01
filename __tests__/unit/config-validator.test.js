// Module under test
const validateConfig = require('../../server/validator/config');
const schema = require('../../server/validator/config/schema');

// Constants
const VALID_CONFIG = {
  DB_DATA_DIR: '/somePath',
  DB_SERVER_PORT: '8091'
};

const MESSAGES = schema.errorMessage;

describe('Config Validator [UNIT]', () => {
  test('no errors returned if valid', () => {
    const errors = validateConfig(VALID_CONFIG);
    expect(errors).toEqual([]);
  });

  test('returns correct error for DB_DATA_DIR missing', () => {
    const config = { ...VALID_CONFIG };
    delete config.DB_DATA_DIR;

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(MESSAGES.required.DB_DATA_DIR);
  });

  test('returns correct error for DB_SERVER_PORT non-numeric', () => {
    const config = { ...VALID_CONFIG };
    config.DB_SERVER_PORT = 'NOT A NUM';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(MESSAGES.properties.DB_SERVER_PORT);
  });

  test('returns multiple errors', () => {
    const config = { ...VALID_CONFIG };
    // Missing DB_DATA_DIR
    delete config.DB_DATA_DIR;
    // Non-numeric DB_SERVER_PORT
    config.DB_SERVER_PORT = '12ABC';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(2);
    expect(errors[0].message).toEqual(MESSAGES.required.DB_DATA_DIR);
    expect(errors[1].message).toEqual(MESSAGES.properties.DB_SERVER_PORT);
  });
});
