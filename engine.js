const EventEmitter = require('events');

const memoryIndex = require('./memory-index');
const FileService = require('./file.service');

class StorageEngine extends EventEmitter {
  /**
   *
   * @param {memoryIndex} memoryIndex
   * @param {FileService} fileService
   */
  constructor(memoryIndex, fileService) {
    super();
    this.memoryIndex = memoryIndex;
    this.fileService = fileService;
    this._buildIndex().then(() => {
      this.emit('ready');
    });
  }

  /**
   * Persist the key.
   * @param {any} key
   * @param {any} value
   */
  async set(key, value) {
    const offset = await this.fileService.write(key, value);
    this.memoryIndex.set(key, offset);
  }

  /**
   * Retrieve the key.
   * @param {any} key
   * @returns
   */
  async get(key) {
    const offset = this.memoryIndex.get(key);
    return offset !== undefined ? await this.fileService.read(offset) : null;
  }

  /**
   * Delete the key.
   * This is really a soft delete - should be visible in the logs until
   * compaction occurs, which is not implemented yet.
   * @param {*} key
   */
  async delete(key) {
    await this.set(key, null);
  }

  /**
   * Builds the index of offsets based on the latest segment file.
   * TODO: future - lot of work to be done here, if file doesn't exist, multiple files etc
   * @private
   */
  async _buildIndex() {
    const keyOffsetArray = await this.fileService.getSegmentOffsets();
    this.memoryIndex.setAll(keyOffsetArray);
  }
}

module.exports = StorageEngine;
