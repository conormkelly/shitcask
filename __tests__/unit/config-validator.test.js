// Module under test
const validateConfig = require('../../server/validator/config');
const schema = require('../../server/validator/config/schema');

const ERR_MESSAGES = schema.errorMessage;

describe('Config Validator [UNIT]', () => {
  let config;

  beforeEach(() => {
    // A complete valid config that we can modify as needed per test case.
    config = {
      DB_DATA_DIR: '/somePath',
      DB_SERVER_PORT: '8091',
      DB_USE_MEMFS: 'true',
      DB_USERNAME: 'test',
      DB_PASSWORD: 'test',
      DB_TLS_CERT_PATH: '/certs/localhost.crt',
      DB_TLS_KEY_PATH: '/certs/localhost.key',
      READ_BUFFER_BYTE_SIZE: '16384' // 16kb
    };
  });

  //* General

  test('no errors returned if valid', () => {
    const errors = validateConfig(config);
    expect(errors).toEqual([]);
  });

  test('types coerced correctly', () => {
    validateConfig(config);

    expect(typeof config.DB_DATA_DIR).toEqual('string');
    expect(typeof config.DB_SERVER_PORT).toEqual('number');
    expect(typeof config.DB_USE_MEMFS).toEqual('boolean');
    expect(typeof config.DB_USERNAME).toEqual('string');
    expect(typeof config.DB_PASSWORD).toEqual('string');
    expect(typeof config.DB_TLS_CERT_PATH).toEqual('string');
    expect(typeof config.DB_TLS_KEY_PATH).toEqual('string');
    expect(typeof config.READ_BUFFER_BYTE_SIZE).toEqual('number');
  });

  test('returns multiple errors', () => {
    // Missing DB_DATA_DIR
    delete config.DB_DATA_DIR;
    // Non-numeric DB_SERVER_PORT
    config.DB_SERVER_PORT = '12ABC';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(2);
    expect(errors[0].message).toEqual(ERR_MESSAGES.required.DB_DATA_DIR);
    expect(errors[1].message).toEqual(ERR_MESSAGES.properties.DB_SERVER_PORT);
  });

  //* DB_DATA_DIR

  test('returns correct error for DB_DATA_DIR missing', () => {
    delete config.DB_DATA_DIR;

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.required.DB_DATA_DIR);
  });

  //* DB_SERVER_PORT

  test('returns correct error for DB_SERVER_PORT non-numeric', () => {
    config.DB_SERVER_PORT = 'NOT A NUM';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.properties.DB_SERVER_PORT);
  });

  //* DB_USE_MEMFS

  test('returns correct error for DB_USE_MEMFS if not boolean', () => {
    config.DB_USE_MEMFS = 'maybe';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.properties.DB_USE_MEMFS);
  });

  test('returns correct error for DB_USE_MEMFS if not boolean', () => {
    config.DB_USE_MEMFS = 'maybe';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.properties.DB_USE_MEMFS);
  });

  //* DB_USERNAME
  //* DB_PASSWORD

  test('is valid without DB_USERNAME and DB_PASSWORD', () => {
    delete config.DB_USERNAME;
    delete config.DB_PASSWORD;

    const errors = validateConfig(config);

    expect(errors.length).toEqual(0);
  });

  test('is invalid with only DB_USERNAME and no DB_PASSWORD', () => {
    delete config.DB_PASSWORD;

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.dependencies.DB_USERNAME);
  });

  test('is invalid with only DB_PASSWORD and no DB_USERNAME', () => {
    delete config.DB_USERNAME;

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.dependencies.DB_PASSWORD);
  });

  test('is invalid with empty DB_USERNAME and DB_PASSWORD', () => {
    config.DB_USERNAME = '   ';
    config.DB_PASSWORD = '';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(2);
    expect(errors[0].message).toEqual(ERR_MESSAGES.properties.DB_USERNAME);
    expect(errors[1].message).toEqual(ERR_MESSAGES.properties.DB_PASSWORD);
  });

  //* DB_TLS_KEY_PATH
  //* DB_TLS_CERT_PATH

  test('is valid without DB_TLS_KEY_PATH and DB_TLS_CERT_PATH', () => {
    delete config.DB_TLS_KEY_PATH;
    delete config.DB_TLS_CERT_PATH;

    const errors = validateConfig(config);

    expect(errors.length).toEqual(0);
  });

  test('is invalid with only DB_TLS_KEY_PATH and no DB_TLS_CERT_PATH', () => {
    delete config.DB_TLS_CERT_PATH;

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.dependencies.DB_TLS_KEY_PATH);
  });

  test('is invalid with only DB_TLS_CERT_PATH and no DB_TLS_KEY_PATH', () => {
    delete config.DB_TLS_KEY_PATH;

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(ERR_MESSAGES.dependencies.DB_TLS_CERT_PATH);
  });

  //* READ_BUFFER_BYTE_SIZE

  test('returns correct error for READ_BUFFER_BYTE_SIZE if not number', () => {
    config.READ_BUFFER_BYTE_SIZE = 'thirty two';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      ERR_MESSAGES.properties.READ_BUFFER_BYTE_SIZE
    );
  });

  test('returns correct error for READ_BUFFER_BYTE_SIZE if not integer', () => {
    config.READ_BUFFER_BYTE_SIZE = '32.5';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      ERR_MESSAGES.properties.READ_BUFFER_BYTE_SIZE
    );
  });

  test('returns correct error for READ_BUFFER_BYTE_SIZE if too small', () => {
    config.READ_BUFFER_BYTE_SIZE = '12';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      ERR_MESSAGES.properties.READ_BUFFER_BYTE_SIZE
    );
  });

  test('accepts valid numeric string for READ_BUFFER_BYTE_SIZE', () => {
    config.READ_BUFFER_BYTE_SIZE = '32';

    const errors = validateConfig(config);

    expect(errors.length).toEqual(0);
  });
});
