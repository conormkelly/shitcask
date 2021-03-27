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
   * @param {fs.PathLike} filePath File path.
   * @param {number} offset Position within the file.
   */
  async readLineFromOffset(filePath, offset) {
    return new Promise((resolve, reject) => {
      try {
        const rs = this.fs.createReadStream(filePath, {
          start: offset,
        });

        const rl = readline.createInterface({
          input: rs,
          console: false,
        });

        rl.on('error', (err) => {
          rs.close();
          rl.close();
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

  async appendToFile(filePath, data) {
    return new Promise(async (resolve, reject) => {
      try {
        // FIXME: will fail if file doesn't exist
        const stats = await this.stat(filePath);
        const offset = stats.size;

        const ws = this.fs.createWriteStream(filePath, {
          start: offset,
          // Change to a+ when I implement fix for above
          flags: 'a',
        });

        ws.on('error', (err) => {
          reject(err);
        });

        ws.cork();
        ws.write(data);
        process.nextTick(() => {
          ws.uncork();
          resolve(offset);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async stat(filePath) {
    return this.fs.promises.stat(filePath);
  }

  async getSegmentOffsets(filePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const rs = this.fs.createReadStream(filePath);

        const rl = this.readline.createInterface({
          input: rs,
          console: false,
        });

        const segmentOffsets = [];

        let position = { current: 0, next: 0 };
        for await (const line of rl) {
          position.next =
            position.current + Buffer.byteLength(`${line}\n`, 'utf8');
          const parsedLine = JSON.parse(line);
          segmentOffsets.push({ key: parsedLine.k, offset: position.current });
          position.current = position.next;
        }

        rl.close();
        rs.close();

        resolve(segmentOffsets);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = FileService;
