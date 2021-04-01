/**
 * A key-value map where:
 * ```json
 * {
 *   "key": "string",
 *   "value": "number" // Offset in segment file
 * }
 * ```
 */
class MemoryIndex {
  _memIndex;

  constructor () {
    this._memIndex = new Map();
  }

  /**
   * Get the segment file offset for a key.
   *
   * Returns `undefined` if the key doesn't exist.
   * @param {any} key
   * @returns {number | undefined} Segment file offset.
   */
  get (key) {
    return this._memIndex.get(key);
  }

  /**
   * Store the segment file offset value for the key.
   * @param {any} key
   * @param {number} offset
   */
  set (key, offset) {
    this._memIndex.set(key, offset);
  }

  /**
   * Replace the current memory index.
   * Used on startup.
   * @param {Map<string,number>} fileOffsetMap
   */
  load (fileOffsetMap) {
    this._memIndex = fileOffsetMap;
  }

  /**
   * Gets the number of keys in the index.
   * @returns {number} Key count.
   */
  size () {
    return this._memIndex.size;
  }

  /**
   * Get an iterable of [key, offset] pairs in the map.
   * @returns {IterableIterator<[any, number]>}
   */
  getEntries () {
    return this._memIndex.entries();
  }

  /**
   * Clear / wipe the index entirely.
   */
  clear () {
    this._memIndex.clear();
  }
}

module.exports = {
  default: new MemoryIndex(),
  MemoryIndex
};
