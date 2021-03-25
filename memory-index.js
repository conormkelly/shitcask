// A key-value map where:
//   key == key
//   value == the offset in the segment file
const memoryIndex = new Map();

/**
 * Get the segment file offset for a key.
 * @param {any} key
 * @returns Segment file offset.
 */
function get(key) {
  return memoryIndex.get(key);
}

/**
 * Store the segment file offset value for the key.
 * @param {any} key
 * @param {number} offset
 */
function set(key, offset) {
  memoryIndex.set(key, offset);
}

/**
 * Set all the segment file offset value for the keys.
 * @param {{key: any, offset: number}[]} keyOffsets
 */
function setAll(keyOffsets) {
  keyOffsets.forEach(({ key, offset }) => {
    set(key, offset);
  });
}

module.exports = {
  get,
  set,
  setAll,
};
