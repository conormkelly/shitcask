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
  constructor (memoryIndex, fileService, { DB_DATA_DIR }) {
    super();
    // Dependencies
    this.memoryIndex = memoryIndex;
    this.fileService = fileService;

    // Config
    this.DB_DATA_DIR = path.resolve(DB_DATA_DIR);

    logger.info('Performing setup tasks...');
    this.ensureDataDir()
      .then(() => this.selectInitialSegmentFile())
      .then(() => this.buildIndex())
      .then(() => this.emit('ready'))
      .catch((err) => {
        logger.error(`Storage engine setup failed. Reason: ${err.message}`);
        process.exit(1);
      });
  }

  /**
   * Setup task.
   * Ensures that DB_DATA_DIR exists, by creating it if it does not.
   * @returns {Promise<void>}
   */
  async ensureDataDir () {
    logger.info(`DB_DATA_DIR: Ensuring "${this.DB_DATA_DIR}" exists.`);
    const dataDirExists = await this.fileService.exists(this.DB_DATA_DIR);

    if (!dataDirExists) {
      logger.info('DB_DATA_DIR: Not found. Attempting to create...');
      try {
        await this.fileService.createDirectory(this.DB_DATA_DIR);
        logger.info('DB_DATA_DIR: Successfully created.');
      } catch (err) {
        throw new Error(`DB_DATA_DIR: Failed to create - ${err.message}`);
      }
    } else {
      logger.info('DB_DATA_DIR: OK');
    }
  }

  /**
   * Setup task.
   * Selects the initial .seg file, creating it if none exist in DB_DATA_DIR.
   */
  async selectInitialSegmentFile () {
    const segmentFiles = await this.listSegmentFiles();

    // Default to 0.seg
    let segmentFileName = '0.seg';
    if (segmentFiles.length === 0) {
      logger.info(
        'Segment file: No existing files found - attempting to create...'
      );
      await this.createSegmentFile(segmentFileName);
      logger.info('Segment file: Successfully created.');
    } else {
      if (segmentFiles.length === 1) {
        [segmentFileName] = segmentFiles;
      } else {
        try {
          const segmentFileStats = [];

          for (const filename of segmentFiles) {
            const filePath = path.resolve(this.DB_DATA_DIR, filename);
            const stats = await this.fileService.stat(filePath);
            segmentFileStats.push({ filename, stats });
          }

          const latestSegFileStat = segmentFileStats.reduce((prev, current) =>
            prev.mtime > current.mtime ? prev : current
          );
          segmentFileName = latestSegFileStat.filename;
        } catch (err) {
          throw new Error(
            `Segment file: Error occurred while selecting latest: ${err.message}`
          );
        }
      }
    }

    logger.info(`Segment file: Selected "${segmentFileName}".`);

    this.segmentFilePath = path.resolve(this.DB_DATA_DIR, segmentFileName);
  }

  /**
   * Setup task helper.
   * Lists all the .seg files within the DB_DATA_DIR.
   * @returns {Promise<String[]>} Array of .seg file names.
   */
  async listSegmentFiles () {
    logger.info('Segment file: Checking DB_DATA_DIR...');

    let directoryFiles = [];
    try {
      directoryFiles = await this.fileService.listDirectoryFiles(
        path.resolve(this.DB_DATA_DIR)
      );
    } catch (err) {
      throw new Error(`Error listing DB_DATA_DIR directory: ${err.message}`);
    }

    const segmentFiles = directoryFiles.filter(
      (filename) => path.extname(filename) === '.seg'
    );

    return segmentFiles;
  }

  /**
   * Writes a new .seg file to DB_DATA_DIR.
   * @param {string} filename
   * @returns {Promise<void>}
   */
  async createSegmentFile (filename) {
    try {
      const filePath = path.resolve(this.DB_DATA_DIR, filename);
      await this.fileService.createFile(filePath, '');
    } catch (err) {
      throw new Error(
        `Error creating segment file "${filename}": ${err.message}`
      );
    }
  }

  /**
   * Builds the index of offsets based on the segment file.
   */
  async buildIndex () {
    logger.info('Index: Starting build...');

    const keyOffsetArray = await this.fileService.getSegmentLineOffsets(
      this.segmentFilePath
    );

    // TODO: even though this only operates on a single .seg file now,
    // we might be rebuilding this on the fly later,
    // if we swap over files after compaction,
    // So keeping this "clear" command here for visibility
    this.memoryIndex.clear();

    this.memoryIndex.setAll(keyOffsetArray);

    logger.info('Index: OK');
  }

  /**
   * Persist a key-value pair.
   * @param {any} key
   * @param {any} value
   */
  async set (key, value) {
    const offset = await this.fileService.appendToFile(
      this.segmentFilePath,
      `${JSON.stringify({ k: key, v: value })}\n`
    );
    this.memoryIndex.set(key, offset);
  }

  /**
   * Retrieve the value for a key.
   * @param {any} key
   * @returns {any | null}
   */
  async get (key) {
    const offset = this.memoryIndex.get(key);

    if (offset === undefined) {
      return null;
    } else {
      const line = await this.fileService.readLineFromOffset(
        this.segmentFilePath,
        offset
      );
      // Records are currently stored as {k, v} plaintext JSON
      return JSON.parse(line).v;
    }
  }
}

function initialize () {
  const fileService = new FileService(fs, readline);
  return new StorageEngine(memoryIndex, fileService, config);
}

module.exports = {
  initialize,
  StorageEngine
};
