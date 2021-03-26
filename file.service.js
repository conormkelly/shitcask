// Dependencies: imported here to define the types in JSdoc,
// but they are provided via constructor injection.
const fs = require('fs');
const readline = require('readline');

class FileService {
  /**
   * @param {fs} fs
   * @param {readline} readline
   */
  constructor(fs, readline) {
    // Dependencies
    this.fs = fs;
    this.readline = readline;
  }

  /**
   * Get the file descriptor by filename.
   * @param {fs.PathLike} filename
   * @param { 'r' | 'w' | 'a' } mode
   * @returns {Promise<number>} File descriptor.
   */
  async getFileDescriptor(filename, mode) {
    return this.fs.promises.open(filename, mode);
  }

  /**
   * @param {number} fd File descriptor.
   * @param {number} offset Position within the file.
   */
  async readLineFromOffset(fd, offset) {
    return new Promise((resolve, reject) => {
      try {
        const rs = this.fs.createReadStream(null, { fd, start: offset });

        const rl = readline.createInterface({
          input: rs,
          console: false,
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

  async appendToFile(fd, data) {
    // TODO: reimplement with writeStream
    // Only writes to file if server closes... hmm
    const stats = await this.stat(fd);
    await fd.appendFile(data);
    return stats.size;
  }

  async stat(fd) {
    return fd.stat();
  }

  async getSegmentOffsets(fd) {
    const rs = this.fs.createReadStream(null, { fd, start: 0 });

    const rl = this.readline.createInterface({
      input: rs,
      console: false,
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
}

module.exports = FileService;
