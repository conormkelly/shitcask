// Schemas used by validator for SET and GET operations.

module.exports = {
  set: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://www.shitcask.org/schemas/set.js',
    title: 'Set',
    description: 'Validates a SET operation',
    type: 'object',
    properties: {
      key: {
        description: 'The key to set.',
      },
      value: {
        description: 'The value to set.',
      },
    },
    required: ['key', 'value'],
    additionalProperties: false,
  },
  get: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://www.shitcask.org/schemas/get.js',
    title: 'Get',
    description: 'Validates a GET operation',
    type: 'object',
    properties: {
      key: {
        description: 'The key to lookup a value for.',
      },
    },
    required: ['key'],
    additionalProperties: false,
  },
};
