// Initialize dependencies

const fs = require('fs');
const readline = require('readline');

const logger = require('./logger');
const StorageEngine = require('./engine');
const memoryIndex = require('./memory-index');
const FileService = require('./file.service');

function initialize() {
  const directory = process.env.SHITCASK_DATA_DIRECTORY || './__tests__/data';

  logger.debug(`DATA_DIRECTORY: ${directory}`);

  const fileService = new FileService(fs, readline);
  return new StorageEngine(memoryIndex, fileService, { directory });
}

module.exports = { initialize };
