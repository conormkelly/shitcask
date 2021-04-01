// Module under test
const validateConfig = require('../../server/validator/config');
const schema = require('../../server/validator/config/schema');

// Test helper
const getValidConfig = () => {
  return {
    DB_DATA_DIR: '/somePath',
    DB_SERVER_PORT: '8091',
    DB_USE_MEMFS: 'true',
    READ_BUFFER_BYTE_SIZE: 16384 // 16kb
  };
};

const ERR_MESSAGES = schema.errorMessage;

describe('Config Validator [UNIT]', () => {
  test('no errors returned if valid', () => {
    const config = getValidConfig();
    const errors = validateConfig(config);
    expect(errors).toEqual([]);
  });

  test('types coerced correctly', () => {
    const config = getValidConfig();
    validateConfig(config);

    expect(typeof config.DB_DATA_DIR).toEqual('string');
    expect(typeof config.DB_SERVER_PORT).toEqual('number');
    expect(typeof config.DB_USE_MEMFS).toEqual('boolean');
    expect(typeof config.READ_BUFFER_BYTE_SIZE).toEqual('number');
  });

  test('returns correct error for DB_DATA_DIR missing', () => {
    const config = getValidConfig();
    delete config.DB_DATA_DIR;

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.required.DB_DATA_DIR);
  });

  test('returns correct error for DB_SERVER_PORT non-numeric', () => {
    const config = getValidConfig();
    config.DB_SERVER_PORT = 'NOT A NUM';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.properties.DB_SERVER_PORT);
  });

  test('returns correct error for DB_USE_MEMFS if not boolean', () => {
    const config = getValidConfig();
    config.DB_USE_MEMFS = 'maybe';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.properties.DB_USE_MEMFS);
  });

  test('returns correct error for DB_USE_MEMFS if not boolean', () => {
    const config = getValidConfig();
    config.DB_USE_MEMFS = 'maybe';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.properties.DB_USE_MEMFS);
  });

  test('returns correct error for READ_BUFFER_BYTE_SIZE if not number', () => {
    const config = getValidConfig();
    config.READ_BUFFER_BYTE_SIZE = 'thirty two';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      ERR_MESSAGES.properties.READ_BUFFER_BYTE_SIZE
    );
  });

  test('returns correct error for READ_BUFFER_BYTE_SIZE if too small', () => {
    const config = getValidConfig();
    config.READ_BUFFER_BYTE_SIZE = '12';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      ERR_MESSAGES.properties.READ_BUFFER_BYTE_SIZE
    );
  });

  test('returns correct error for READ_BUFFER_BYTE_SIZE if not a multiple of 4', () => {
    const config = getValidConfig();
    config.READ_BUFFER_BYTE_SIZE = '255';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      ERR_MESSAGES.properties.READ_BUFFER_BYTE_SIZE
    );
  });

  test('accepts valid numeric string for READ_BUFFER_BYTE_SIZE', () => {
    const config = getValidConfig();
    config.READ_BUFFER_BYTE_SIZE = '32';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(0);
  });

  test('returns multiple errors', () => {
    const config = getValidConfig();
    // Missing DB_DATA_DIR
    delete config.DB_DATA_DIR;
    // Non-numeric DB_SERVER_PORT
    config.DB_SERVER_PORT = '12ABC';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(2);
    expect(errors[0].message).toEqual(ERR_MESSAGES.required.DB_DATA_DIR);
    expect(errors[1].message).toEqual(ERR_MESSAGES.properties.DB_SERVER_PORT);
  });
});
