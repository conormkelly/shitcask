// Initialize dependencies

const fs = require('fs');
const readline = require('readline');

const StorageEngine = require('./engine');
const memoryIndex = require('./memory-index');
const FileService = require('./file.service');

function initialize() {
  // TODO: future - directory isn't currently considered
  const dbDirectory = process.env.MY_DB_DIRECTORY || '.';

  const fileService = new FileService(fs, readline, {
    directory: dbDirectory,
  });

  return new StorageEngine(memoryIndex, fileService);
}

module.exports = { initialize };
