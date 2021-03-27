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
      minLength: 1,
    },
    DB_SERVER_PORT: {
      description: 'The port for the server to listen on',
    },
  },
  errorMessage: {
    required: {
      DB_DATA_DIR: "Environment variable 'DB_DATA_DIR' is required",
    },
  },
  required: ['DB_DATA_DIR'],
};
