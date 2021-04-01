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
        type: 'string'
      },
      value: {
        description: 'The value to set.'
      }
    },
    required: ['key', 'value'],
    additionalProperties: false,
    errorMessage: {
      properties: {
        key: "'key' should be of type 'string'"
      },
      required: "'key' and 'value' are required",
      additionalProperties: "should only provide 'key' and 'value'",
      type: "should provide an object containing 'key' and 'value'",
      _: "should provide an object containing only 'key' and 'value'"
    }
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
        type: 'string'
      }
    },
    required: ['key'],
    additionalProperties: false,
    errorMessage: {
      properties: {
        key: "'key' should be of type 'string'"
      },
      required: "'key' is required",
      additionalProperties: "should only provide 'key'",
      type: "should provide an object containing 'key'",
      _: "should provide an object containing only 'key'"
    }
  }
};
