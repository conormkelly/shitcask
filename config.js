// Initialize dependencies

const fs = require('fs');
const readline = require('readline');

const StorageEngine = require('./engine');
const memoryIndex = require('./memory-index');
const FileService = require('./file.service');

function initialize() {
  const dbDirectory = process.env.SHITCASK_DATA_DIRECTORY || './__tests__/data';

  console.log('DATA_DIRECTORY:', dbDirectory);

  const fileService = new FileService(fs, readline, {
    directory: dbDirectory,
  });

  return new StorageEngine(memoryIndex, fileService);
}

module.exports = { initialize };
