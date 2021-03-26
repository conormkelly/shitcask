const fs = require('fs');
const path = require('path');

const EventEmitter = require('events');

const memoryIndex = require('./memory-index');
const FileService = require('./file.service');

class StorageEngine extends EventEmitter {
  /**
   *
   * @param {memoryIndex} memoryIndex
   * @param {FileService} fileService
   * @param {{directory: fs.PathLike | string }} config
   */
  constructor(memoryIndex, fileService, { directory }) {
    super();
    // Dependencies
    this.memoryIndex = memoryIndex;
    this.fileService = fileService;
    // Config
    this.directory = directory;

    // Perform setup tasks
    this.initializeSegmentFile().then(() => {
      this.emit('ready');
    });
  }

  async initializeSegmentFile() {
    // TODO: hardcoded name here - need to check dir for existing files
    const segmentFilePath = path.resolve(this.directory, '0.seg');
    console.log('segmentFile:', segmentFilePath);
    const segmentFd = await this.fileService.getFileDescriptor(
      segmentFilePath,
      'a'
    );

    this.segmentFd = segmentFd;
  }

  /**
   * Builds the index of offsets based on the latest segment file.
   * TODO: future - lot of work to be done here, if file doesn't exist, multiple files etc
   * @private
   */
  async _buildIndex() {
    console.log('BI FD:', this.segmentFd);
    const keyOffsetArray = await this.fileService.getSegmentOffsets(
      this.segmentFd
    );
    this.memoryIndex.setAll(keyOffsetArray);
  }

  /**
   * Persist the key.
   * @param {any} key
   * @param {any} value
   */
  async set(key, value) {
    console.time('set operation');
    const offset = await this.fileService.appendToFile(
      this.segmentFd,
      `${JSON.stringify({ k: key, v: value })}\n`
    );
    console.log('THE OFFSET IS', offset);
    this.memoryIndex.set(key, offset);
    console.timeEnd('set operation');
  }

  /**
   * Retrieve the key.
   * @param {any} key
   * @returns
   */
  async get(key) {
    console.time('get operation');
    const offset = this.memoryIndex.get(key);
    const value =
      offset !== undefined
        ? await this.fileService.readLineFromOffset(this.segmentFd, this.offset)
        : null;
    console.timeEnd('get operation');
    return value;
  }
}

module.exports = StorageEngine;
