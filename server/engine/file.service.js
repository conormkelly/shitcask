// Dependencies: imported here to define the types in JSdoc,
// but they are provided via constructor injection.
const fs = require('fs');
const readline = require('readline');

class FileService {
  /**
   * @param {fs} fs
   * @param {readline} readline
   */
  constructor (fs, readline) {
    // Dependencies
    this.fs = fs;
    this.readline = readline;
  }

  /**
   * Check if the file or directory exists.
   * @param {fs.PathLike} path Directory or file path.
   * @returns {Promise<boolean>}
   */
  async exists (path) {
    try {
      await fs.promises.access(path, fs.constants.F_OK);
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
    return fs.promises.readdir(directoryPath);
  }

  /**
   * Recursively create a directory.
   * @param {fs.PathLike} directoryPath
   * @returns {Promise<void>}
   */
  async createDirectory (directoryPath) {
    return fs.promises.mkdir(directoryPath, { recursive: true });
  }

  /**
   * Create a file.
   * @param {fs.PathLike} filePath
   * @param {string | Uint8Array} data
   * @returns {Promise<void>}
   */
  async createFile (filePath, data) {
    return fs.promises.writeFile(filePath, data);
  }

  /**
   * Read the line at a given offset within a file.
   * @param {fs.PathLike} filePath File path.
   * @param {number} offset Position within the file.
   * @returns {Promise<string>}
   */
  async readLineFromOffset (filePath, offset) {
    return new Promise((resolve, reject) => {
      try {
        const rs = this.fs
          .createReadStream(filePath, {
            start: offset
          })
          .on('error', (err) => {
            reject(err);
          });

        const rl = readline
          .createInterface({
            input: rs,
            console: false
          })
          .on('error', (err) => {
            reject(err);
          });

        rl.on('line', (line) => {
          rs.close();
          rl.close();
          resolve(line);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Append data to an existing file.
   * Returns the offset (used by the memoryIndex).
   * @param {fs.PathLike} filePath
   * @param {any} data
   * @returns {Promise<number>} Start offset of where the data was written.
   */
  async appendToFile (filePath, data) {
    return new Promise((resolve, reject) => {
      this.stat(filePath)
        .then((stats) => {
          const offset = stats.size;

          const ws = this.fs
            .createWriteStream(filePath, {
              start: offset,
              // Change to a+ when I implement fix for above
              flags: 'a'
            })
            .on('error', (err) => {
              reject(err);
            });

          ws.cork();
          ws.write(data);
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
   * Finds the key and offset for each line in a segment file.
   * @param {fs.PathLike} filePath
   * @returns {{key: any, offset: number}[]} Seg file line offsets.
   */
  async getSegmentLineOffsets (filePath) {
    const rs = this.fs.createReadStream(filePath).on('error', (err) => {
      throw err;
    });

    const rl = this.readline
      .createInterface({
        input: rs,
        console: false
      })
      .on('error', (err) => {
        throw err;
      });

    const segmentOffsets = [];

    const position = { current: 0, next: 0 };
    for await (const line of rl) {
      position.next = position.current + Buffer.byteLength(`${line}\n`, 'utf8');
      const parsedLine = JSON.parse(line);
      segmentOffsets.push({ key: parsedLine.k, offset: position.current });
      position.current = position.next;
    }

    rl.close();
    rs.close();

    return segmentOffsets;
  }
}

module.exports = FileService;
