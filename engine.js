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

    console.time('Index build');
    this._buildIndex().then(() => {
      console.timeEnd('Index build');
      console.log('Index size', this.memoryIndex.size());

      console.time('Compaction');
      this._doCompaction().then(() => {
        console.timeEnd('Compaction');
        this.emit('ready');
      });
    });
  }

  /**
   * Persist the key.
   * @param {any} key
   * @param {any} value
   */
  async set(key, value) {
    console.time('set operation');
    const offset = await this.fileService.write(key, value);
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
      offset !== undefined ? await this.fileService.read(offset) : null;
    console.timeEnd('get operation');
    return value;
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

  async _doCompaction() {
    // TODO: This works but it's slow
    // and it doesnt switch over to the new file
    const indexEntries = this.memoryIndex.getEntries();
    await this.fileService.writeSegmentFile(indexEntries);
  }
}

module.exports = StorageEngine;
