module.exports = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://www.shitcask.org/schemas/config.js',
  title: 'Config',
  description: 'Validates environment config',
  type: 'object',
  properties: {
    DB_DATA_DIR: {
      description: 'Directory to store .seg files in',
      type: 'string',
      minLength: 1
    },
    DB_SERVER_PORT: {
      description: 'The port for the server to listen on',
      type: 'integer',
      default: 8091,
      minimum: 1,
      maximum: 65353
    },
    DB_USE_MEMFS: {
      description: 'Whether to operate on an in-memory filesystem',
      type: 'boolean',
      default: false
    },
    DB_USERNAME: {
      description: `Optional. Username that user must provide when connecting.
                    Both DB_USERNAME and DB_PASSWORD should be present.`,
      type: 'string',
      pattern: '^(?!\\s*$).+'
    },
    DB_PASSWORD: {
      description: `Optional. Password that user must provide when connecting.
                    Both DB_USERNAME and DB_PASSWORD should be present.`,
      type: 'string',
      pattern: '^(?!\\s*$).+',
      isSensitive: true
    },
    READ_BUFFER_BYTE_SIZE: {
      description: `Limits the size of the buffer used to read files.
                    Setting this will override defaults and is not recommended, but its useful for testing purposes.`,
      type: 'integer',
      minimum: 16,
      default: 16384 // 16kb
    }
  },
  dependencies: {
    DB_USERNAME: ['DB_PASSWORD'],
    DB_PASSWORD: ['DB_USERNAME']
  },
  required: ['DB_DATA_DIR'],
  errorMessage: {
    required: {
      DB_DATA_DIR: "Environment variable 'DB_DATA_DIR' is required"
    },
    properties: {
      DB_DATA_DIR: 'DB_DATA_DIR: must be a valid directory path',
      DB_SERVER_PORT: 'DB_SERVER_PORT: must be an integer between 1 - 65353',
      DB_USE_MEMFS: "DB_USE_MEMFS: must be 'true' or 'false'",
      DB_USERNAME: 'DB_USERNAME: must be a non-empty string',
      DB_PASSWORD: 'DB_PASSWORD: must be a non-empty string',
      READ_BUFFER_BYTE_SIZE: 'READ_BUFFER_BYTE_SIZE: must be an integer >= 16'
    },
    dependencies: {
      DB_USERNAME: 'DB_USERNAME: must also provide DB_PASSWORD',
      DB_PASSWORD: 'DB_PASSWORD: must also provide DB_USERNAME'
    }
  }
};
