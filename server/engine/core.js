const logger = require('../logger');

const memoryIndex = require('./memory-index');
const FileService = require('./file.service');
const config = require('../config');

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const EventEmitter = require('events');

class StorageEngine extends EventEmitter {
  /**
   *
   * @param {memoryIndex} memoryIndex
   * @param {FileService} fileService
   * @param {{DB_DATA_DIR: fs.PathLike | string }} config
   */
  constructor(memoryIndex, fileService, { DB_DATA_DIR }) {
    super();
    // Dependencies
    this.memoryIndex = memoryIndex;
    this.fileService = fileService;
    // Config
    this.DB_DATA_DIR = DB_DATA_DIR;

    // Perform setup tasks
    this.initializeSegmentFile()
      .then(() => {
        this._buildIndex().then(() => {
          this.emit('ready');
        });
      })
      .catch((err) => {
        logger.error(`Storage engine setup failed: ${err.message}`);
        process.exit(1);
      });
  }

  async initializeSegmentFile() {
    logger.info('Startup: Initializing segment file');
    // TODO: hardcoded name here - need to check dir for existing files
    this.segmentFilePath = path.resolve(this.DB_DATA_DIR, '0.seg');
  }

  /**
   * Builds the index of offsets based on the latest segment file.
   * TODO: future - lot of work to be done here, if file doesn't exist, multiple files etc
   * @private
   */
  async _buildIndex() {
    logger.info('Startup: Building the index');

    const keyOffsetArray = await this.fileService.getSegmentOffsets(
      this.segmentFilePath
    );
    this.memoryIndex.setAll(keyOffsetArray);
  }

  /**
   * Persist the key.
   * @param {any} key
   * @param {any} value
   */
  async set(key, value) {
    const offset = await this.fileService.appendToFile(
      this.segmentFilePath,
      `${JSON.stringify({ k: key, v: value })}\n`
    );
    this.memoryIndex.set(key, offset);
  }

  /**
   * Retrieve the key.
   * @param {any} key
   * @returns
   */
  async get(key) {
    const offset = this.memoryIndex.get(key);
    const value =
      offset !== undefined
        ? await this.fileService.readLineFromOffset(
            this.segmentFilePath,
            offset
          )
        : null;
    return value ? JSON.parse(value).v : value;
  }
}

function initialize() {
  const fileService = new FileService(fs, readline);
  return new StorageEngine(memoryIndex, fileService, config);
}

module.exports = {
  initialize,
  StorageEngine,
};
