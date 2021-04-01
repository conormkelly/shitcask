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
  const testFileContent = fs.readFileSync(TEST_SEG_FILE);
  memfs.writeFileSync('/0.seg', testFileContent);
});

// Module under test
const FileService = require('../../server/engine/file.service');
const EventEmitter = require('events');
const fileService = new FileService(memfs);

describe('file-service [INTEGRATION]', () => {
  describe('exists()', () => {
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

  describe('stat()', () => {
    test('can stat a file', async () => {
      const testFileStat = await fileService.stat(MEM_SEG_FILE);
      expect(testFileStat.size).toEqual(2080);
    });
  });

  describe('listDirectoryFiles()', () => {
    test('can list directory contents', async () => {
      const testDataDirContents = await fileService.listDirectoryFiles(
        path.resolve(__dirname, '/')
      );

      expect(testDataDirContents).toContain('0.seg');
    });
  });

  describe('readFileOffsets()', () => {
    test('can build memory index', async () => {
      const fileOffsetMap = await fileService.readFileOffsets(MEM_SEG_FILE);
      expect(fileOffsetMap.size).toEqual(100);
    });

    test('should throw if invalid filePath supplied', async () => {
      await expect(
        fileService.readFileOffsets('/file/doesnt/exist.seg')
      ).rejects.toThrow(/no such file or directory/);
    });
  });

  describe('readRecordAtOffset()', () => {
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

    test('should throw if file doesnt exist', async () => {
      await expect(
        fileService.readRecordAtOffset('/bad-filename.seg', 0)
      ).rejects.toThrow(/no such file or directory/);
    });

    test('should throw if offset is null', async () => {
      await expect(
        fileService.readRecordAtOffset(MEM_SEG_FILE, null)
      ).rejects.toThrow(/option must be a Number/);
    });

    test('should throw if offset is negative', async () => {
      await expect(
        fileService.readRecordAtOffset(MEM_SEG_FILE, -10)
      ).rejects.toThrow(/must be >= 0/);
    });

    test('should throw if offset is a string', async () => {
      await expect(
        fileService.readRecordAtOffset(MEM_SEG_FILE, 'some string value')
      ).rejects.toThrow(/option must be a Number/);
    });
  });

  describe('createFile()', () => {
    test('can create a file', async () => {
      const newFilePath = '/1.seg';
      let fileExists = await fileService.exists(newFilePath);
      expect(fileExists).toEqual(false);
      await fileService.createFile(newFilePath, '');
      fileExists = await fileService.exists(newFilePath);
      expect(fileExists).toEqual(true);
    });
  });

  describe('createDirectory()', () => {
    test('can create a directory', async () => {
      const newDirPath = '/test/directory/';
      let dirExists = await fileService.exists(newDirPath);
      expect(dirExists).toEqual(false);
      await fileService.createDirectory(newDirPath);
      dirExists = await fileService.exists(newDirPath);
      expect(dirExists).toEqual(true);
    });
  });

  describe('appendToFile', () => {
    test('can append to a file', async () => {
      const newTestFile = '/2.seg';
      await fileService.createFile(newTestFile, '');
      const fileExists = await fileService.exists(newTestFile);
      expect(fileExists).toEqual(true);

      const testRecord = { key: 'test1', value: 'value1' };
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

    test('should throw if file doesnt exist', async () => {
      await expect(
        fileService.appendToFile('/bogus-file.seg', {
          key: 'test',
          value: 'test'
        })
      ).rejects.toThrow(/no such file or directory/);
    });

    test('should throw if writeStream errors out', async () => {
      // Arrange
      const fakeFs = {
        promises: {
          stat: () => {
            return { size: 1000 };
          }
        },
        createWriteStream: () => {
          const fakeWriteStream = new EventEmitter();
          fakeWriteStream.cork = () => {};
          fakeWriteStream.uncork = () => {};
          fakeWriteStream.write = () => {};
          process.nextTick(() => {
            fakeWriteStream.emit('error', new Error('TEST ERROR'));
          });
          return fakeWriteStream;
        }
      };

      const mockFileService = new FileService(fakeFs);

      await expect(
        mockFileService.appendToFile('/0.seg', {
          key: 'test',
          value: 'test'
        })
      ).rejects.toThrow(/TEST ERROR/);
    });
  });
});
