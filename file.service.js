// Dependencies: imported here to define the types in JSdoc,
// but they are provided via constructor injection.
const fs = require('fs');
const readline = require('readline');

const path = require('path');

class FileService {
  /**
   *
   * @param {fs} fs
   * @param {readline} readline
   * @param {{directory: fs.PathLike | string, segmentFile: string}} options
   */
  constructor(fs, readline, options) {
    // Dependencies
    this.fs = fs;
    this.readline = readline;
    // Config
    this.directory = options.directory;

    // TODO: hardcoded for now.
    this.segmentFile = path.resolve(this.directory, '0.seg');

    console.log('segmentFile', this.segmentFile);
  }

  /**
   * Reads the value of a key via the offset.
   * TODO: there has to be a better way to implement this, with a buffer maybe?
   * @param {number} offset
   * @returns Value located at the key offset.
   */
  async read(offset) {
    const rs = this.fs.createReadStream(this.segmentFile, {
      start: offset,
    });

    const rl = this.readline.createInterface({
      input: rs,
    });

    for await (const line of rl) {
      rl.close();
      rs.close();
      // "value" property of the parsed line
      return JSON.parse(line).v;
    }
  }

  /**
   * Writes a key-value pair to segment file and returns the offset.
   * @param {any} key
   * @param {any} value
   * @returns The offset.
   */
  async write(key, value) {
    return new Promise((resolve, reject) => {
      try {
        this.fs.stat(this.segmentFile, (err, stats) => {
          // We dont care if the file doesn't exist yet,
          // since append will create it if it doesn't
          if (err && !err.message.includes('no such file')) {
            throw err;
          }
          const offset = stats && 'size' in stats ? stats.size : 0;
          const data = `${JSON.stringify({ k: key, v: value })}\n`;
          this.fs.appendFile(this.segmentFile, data, () => {
            resolve(offset);
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async getSegmentOffsets() {
    const rs = this.fs.createReadStream(this.segmentFile, {
      start: 0,
    });

    const rl = this.readline.createInterface({
      input: rs,
    });

    const segmentOffsets = [];

    let position = { current: 0, next: 0 };
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

  async writeSegmentFile(indexEntries) {
    return new Promise(async (resolve, reject) => {
      try {
        // TODO: hardcoded implementation
        // Need to rebuild index as well
        // so major refactor needed
        const segmentFile = './data/1.seg';

        const writeStream = fs
          .createWriteStream(segmentFile, { flags: 'a' })
          .on('error', function (err) {
            reject(err);
          })
          .on('finish', () => {
            resolve(segmentFile);
          });

        // need to track offsets of new files
        for (const [key, offset] of indexEntries) {
          const value = await this.read(offset);
          // // TODO: horribly inefficient
          // const length = JSON.stringify(`${value}\n`).length;
          const data = JSON.stringify({ k: key, v: value });
          writeStream.write(`${data}\n`, (err) => {
            if (err) {
              reject(err);
            }
          });
        }

        writeStream.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = FileService;
