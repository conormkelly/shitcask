// This test file uses memfs to operate on in-memory filesystem.

// Dependencies
const path = require('path');
const fs = require('fs');
const memfs = require('memfs');

// Constants
const MEM_SEG_FILE = '/0.seg';

// One-time setup
beforeAll(() => {
  const TEST_SEG_FILE = path.resolve(__dirname, '../data/0.seg');
  const content = fs.readFileSync(TEST_SEG_FILE);
  memfs.writeFileSync('/0.seg', content);
});

// Module under test
const FileService = require('../../server/engine/file.service');
const fileService = new FileService(memfs);

describe('file-service [INTEGRATION]', () => {
  describe('exists', () => {
    test('confirm that the test file exists', async () => {
      const testFileExists = await fileService.exists(MEM_SEG_FILE);
      expect(testFileExists).toEqual(true);
    });

    test('false for a non-existent file', async () => {
      const fakeFileName = '/.udsfods0.test';
      const fakeFileExists = await fileService.exists(
        path.resolve(__dirname, fakeFileName)
      );
      expect(fakeFileExists).toEqual(false);
    });
  });

  test('can stat a file', async () => {
    const testFileStat = await fileService.stat(MEM_SEG_FILE);
    expect(testFileStat.size).toEqual(2080);
  });

  test('can list directory contents', async () => {
    const testDataDirContents = await fileService.listDirectoryFiles(
      path.resolve(__dirname, '/')
    );

    expect(testDataDirContents).toContain('0.seg');
  });

  test('can build memory index', async () => {
    const fileOffsetMap = await fileService.readFileOffsets(MEM_SEG_FILE);
    expect(fileOffsetMap.size).toEqual(100);
  });

  test('should retrieve the correct key-value pair', async () => {
    // Arrange
    const fileOffsetMap = await fileService.readFileOffsets(MEM_SEG_FILE);
    // This offset would normally come from the memoryIndex
    const offsetForFive = fileOffsetMap.get('5');

    // Act
    const textKeyValue = await fileService.readRecordAtOffset(
      MEM_SEG_FILE,
      offsetForFive
    );

    // The value is raw text - needs to be converted to JSON
    const jsonKeyValue = JSON.parse(textKeyValue);

    expect(jsonKeyValue.k).toEqual('5');
    expect(jsonKeyValue.v).toEqual(5);
  });

  test('can create a file', async () => {
    const newFilePath = '/1.seg';
    let fileExists = await fileService.exists(newFilePath);
    expect(fileExists).toEqual(false);
    await fileService.createFile(newFilePath, '');
    fileExists = await fileService.exists(newFilePath);
    expect(fileExists).toEqual(true);
  });

  test('can create a directory', async () => {
    const newDirPath = '/test/directory/';
    let dirExists = await fileService.exists(newDirPath);
    expect(dirExists).toEqual(false);
    await fileService.createDirectory(newDirPath);
    dirExists = await fileService.exists(newDirPath);
    expect(dirExists).toEqual(true);
  });

  test('can append to a file', async () => {
    const newTestFile = '/2.seg';
    const testRecord = { key: 'test1', value: 'value1' };

    await fileService.createFile(newTestFile, '');
    const offset = await fileService.appendToFile(newTestFile, testRecord);
    expect(offset).toEqual(0);

    // Retrieve value
    const keyValue = await fileService.readRecordAtOffset(newTestFile, 0);
    const parsedKeyValue = JSON.parse(keyValue);
    expect(testRecord).toEqual({
      key: parsedKeyValue.k,
      value: parsedKeyValue.v
    });
  });
});
