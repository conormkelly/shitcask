// A key-value map where:
//   key == key
//   value == the offset in the segment file
const memoryIndex = new Map();

/**
 * Get the segment file offset for a key.
 * Returns `null` if the key doesn't exist.
 * @param {any} key
 * @returns {number | null} Segment file offset.
 */
function get (key) {
  return memoryIndex.get(key);
}

/**
 * Store the segment file offset value for the key.
 * @param {any} key
 * @param {number} offset
 */
function set (key, offset) {
  memoryIndex.set(key, offset);
}

/**
 * Set all the segment file offset value for the keys.
 * @param {{key: any, offset: number}[]} keyOffsets
 */
function setAll (keyOffsets) {
  keyOffsets.forEach(({ key, offset }) => {
    set(key, offset);
  });
}

/**
 * Gets the number of keys in the index.
 * @returns {number} Key count.
 */
function size () {
  return memoryIndex.size;
}

/**
 * Get an iterable of [key, offset] pairs in the map.
 * @returns {IterableIterator<[any, number]>}
 */
function getEntries () {
  return memoryIndex.entries();
}

/**
 * Clear / wipe the index entirely.
 */
function clear () {
  memoryIndex.clear();
}

module.exports = {
  clear,
  get,
  set,
  setAll,
  size,
  getEntries
};
