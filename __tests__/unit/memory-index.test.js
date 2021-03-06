// Module under test
const memoryIndex = require('../../server/engine/memory-index').default;

describe('Memory Index [UNIT]', () => {
  test('should initially be empty', () => {
    expect(memoryIndex.size()).toEqual(0);
  });

  test('should return undefined when getting a non-existent key', () => {
    expect(memoryIndex.get('XYZ')).toBeUndefined();
  });

  test('can get a key that was set', () => {
    // Arrange
    memoryIndex.set('XYZ', 123);
    // Assert
    expect(memoryIndex.get('XYZ')).toEqual(123);
  });

  test('should get the most recently set value', () => {
    memoryIndex.set('ABC', 123);
    memoryIndex.set('ABC', 234);
    expect(memoryIndex.get('ABC')).toEqual(234);
  });

  test('can replace index with load', () => {
    // Arrange
    const fileOffsets = new Map();
    fileOffsets.set('key0', 0);
    fileOffsets.set('key1', 1);

    // Act
    memoryIndex.load(fileOffsets);

    // Assert
    expect(memoryIndex.get('key0')).toEqual(0);
    expect(memoryIndex.get('key1')).toEqual(1);
  });

  test('should wipe the index on clear', () => {
    // Arrange
    // Set a value and confirm it exists
    memoryIndex.set('DEF', 0);
    expect(memoryIndex.size()).not.toEqual(0);
    expect(memoryIndex.get('DEF')).toEqual(0);

    // Act
    // Clear the index
    memoryIndex.clear();

    // Assert
    // Previously set value should be gone
    expect(memoryIndex.size()).toEqual(0);
    expect(memoryIndex.get('DEF')).toEqual(undefined);
  });

  test('can iterate over entries', () => {
    // Arrange:
    // Clear index and set multiple values
    const fileOffsets = new Map();
    fileOffsets.set('key0', 0);
    fileOffsets.set('key1', 1);

    memoryIndex.load(fileOffsets);

    // Act
    const entries = memoryIndex.getEntries();

    let count = 0;
    for (const [key, value] of entries) {
      count += 1;

      expect(typeof key).toEqual('string');
      expect(typeof value).toEqual('number');

      const expectedValue = key === 'key0' ? 0 : 1;
      expect(value).toEqual(expectedValue);
    }

    expect(count).toEqual(2);
  });
});
