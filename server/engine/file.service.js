// fs dependency is only imported here to add types to the JSdocs.
// At runtime, fs is provided to the FileService class via constructor injection.
// This allows us to substitute it for 'memfs' in the tests.

const fs = require('fs'); // eslint-disable-line no-unused-vars

// Constants
const UINT32_BYTE_LEN = Uint32Array.BYTES_PER_ELEMENT;

class FileService {
  /**
   * @param {fs} fs
   * @param {{READ_BUFFER_BYTE_SIZE: number}} config
   */
  constructor (fs, config = {}) {
    // Dependencies
    this.fs = fs;

    // Config
    // Controls'highWaterMark' value for ReadStreams
    this.READ_BUFFER_BYTE_SIZE = config.READ_BUFFER_BYTE_SIZE;
  }

  /**
   * Check if the file or directory exists.
   * @param {fs.PathLike} path Directory or file path.
   * @returns {Promise<boolean>}
   */
  async exists (path) {
    try {
      await this.fs.promises.access(path, this.fs.constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Get stats for the filePath.
   * @param {fs.PathLike} filePath
   * @returns {Promise<fs.Stats>}
   */
  async stat (filePath) {
    return this.fs.promises.stat(filePath);
  }

  /**
   * List the files in a directory.
   * @param {fs.PathLike} directoryPath
   * @returns {Promise<string[]}
   */
  async listDirectoryFiles (directoryPath) {
    return this.fs.promises.readdir(directoryPath);
  }

  /**
   * Recursively create a directory.
   * @param {fs.PathLike} directoryPath
   * @returns {Promise<void>}
   */
  async createDirectory (directoryPath) {
    return this.fs.promises.mkdir(directoryPath, { recursive: true });
  }

  /**
   * Create a file.
   * @param {fs.PathLike} filePath
   * @param {string | Uint8Array} data
   * @returns {Promise<void>}
   */
  async createFile (filePath, data) {
    return this.fs.promises.writeFile(filePath, data);
  }

  /**
   * Read the record at a given offset within a file.
   * @param {fs.PathLike} filePath File path.
   * @param {number} offset Position within the file.
   * @returns {Promise<string>} JSON string.
   */
  async readRecordAtOffset (filePath, offset) {
    return new Promise((resolve, reject) => {
      let fileBuffer = null;
      let recordLength = null;

      const readStream = this.fs
        .createReadStream(filePath, {
          start: offset,
          highWaterMark: this.READ_BUFFER_BYTE_SIZE
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('data', (chunk) => {
          // If this is the first event, chunk IS the buffer, otherwise concat it to existing buffer
          fileBuffer = !fileBuffer ? chunk : Buffer.concat([fileBuffer, chunk]);
          // recordLength only needs to be calculated once
          recordLength = recordLength ?? fileBuffer.readUInt32LE(0);

          // Do we have all the data?
          if (fileBuffer.byteLength >= UINT32_BYTE_LEN + recordLength) {
            readStream.close();

            // Buffer starts with recordLength as UInt32
            const rawRecord = fileBuffer.slice(
              UINT32_BYTE_LEN,
              UINT32_BYTE_LEN + recordLength
            );
            resolve(rawRecord.toString('utf8'));
          }
        });
    });
  }

  /**
   * Append data to an existing file.
   * Returns the offset (used by the memoryIndex).
   * @param {fs.PathLike} filePath
   * @param {{key: string, value: any}} keyValuePair
   * @returns {Promise<number>} Offset of where the data was written.
   */
  async appendToFile (filePath, { key, value }) {
    return new Promise((resolve, reject) => {
      // Create a buffer to write record
      const data = JSON.stringify({ k: key, v: value });
      const byteCount = Buffer.byteLength(data);
      const buffer = Buffer.alloc(UINT32_BYTE_LEN + byteCount);
      // First 4 bytes is for record length
      buffer.writeInt32LE(byteCount, 0);
      // Rest of the buffer is a utf8 string
      buffer.write(data, UINT32_BYTE_LEN, 'utf8');

      this.stat(filePath)
        .then((stats) => {
          const offset = stats.size;

          const ws = this.fs
            .createWriteStream(filePath, {
              start: offset,
              flags: 'a'
            })
            .on('error', (err) => {
              reject(err);
            });

          ws.cork();
          ws.write(buffer);
          process.nextTick(() => {
            ws.uncork();
            resolve(offset);
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Finds the key and offset for each record in a segment file.
   * @param {fs.PathLike} filePath
   * @returns {Map<string, number} Seg file line offsets.
   */
  async readFileOffsets (filePath) {
    return new Promise((resolve, reject) => {
      const fileOffsets = new Map();

      // To calculate absolute position (for offset) within the file
      let numBytesParsed = 0;
      let fileBuffer = null;

      this.fs
        .createReadStream(filePath, {
          start: 0,
          highWaterMark: this.READ_BUFFER_BYTE_SIZE
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('data', (chunk) => {
          // Initialize or concat the fileBuffer
          fileBuffer = !fileBuffer ? chunk : Buffer.concat([fileBuffer, chunk]);
          let relativePosition = 0;

          // First 4 bytes of buff is always an int32 that tells how long the record is
          let recordLength = fileBuffer.readUInt32LE(relativePosition);

          // While we have records in the buffer
          while (
            fileBuffer.byteLength >=
            relativePosition + UINT32_BYTE_LEN + recordLength
          ) {
            // Parse the record and set the offset
            recordLength = fileBuffer.readUInt32LE(relativePosition);
            const recordData = fileBuffer.slice(
              relativePosition + UINT32_BYTE_LEN,
              relativePosition + UINT32_BYTE_LEN + recordLength
            );
            const key = JSON.parse(recordData.toString('utf8')).k;
            fileOffsets.set(key, relativePosition + numBytesParsed);

            // Loop will break if buffer exhausted
            relativePosition += UINT32_BYTE_LEN + recordLength;
          }
          // If buffer exhausted - relativePosition contains the recordLength for next record
          // Buffer is concatenated on next "data" event so we
          // dont have to worry about record size, they can span across buffers
          fileBuffer = fileBuffer.slice(relativePosition);
          // Tracks total number of bytes to determine absolute offsets within the file
          numBytesParsed += relativePosition;
        })
        .on('end', () => {
          resolve(fileOffsets);
        });
    });
  }
}

module.exports = FileService;
