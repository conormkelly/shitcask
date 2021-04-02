# shitcask

_I can't believe it's not [Bitcask](https://en.wikipedia.org/wiki/Bitcask)_...

## About

### What is this?

- A pure Node.js database server and client.
- Loosely-based on Bitcask, reverse-engineered purely based on the descriptions from chapter 3 of the excellent book;  
  [Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems](https://www.amazon.co.uk/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321) by Martin Kleppmann.
- A work in progress.

## How do I use it?

1. `npm install`
2. Set the DB_DATA_DIR environment variable.

   ```sh
   # This can be a relative or absolute path.
   # It will be created if it doesn't exist.
   export DB_DATA_DIR=./my_data_directory
   ```

3. Start the server via: `npm start`
4. In a separate terminal, run: `npm run client-demo` to run the demo client queries.

You should then be able to review the logs in the client and server terminals.

_The client will be split into a separate repo in future._

## Configuration

Environment variables are described below.

| Name                  | Type    | Purpose                                                                              | Required?     | Default |
| --------------------- | ------- | ------------------------------------------------------------------------------------ | ------------- | ------- |
| DB_DATA_DIR           | string  | Sets the directory where the DB writes its files.                                    | Yes           | N/A     |
| DB_SERVER_PORT        | int     | The port for the server to listen on.                                                | No            | 8091    |
| DB_USE_MEMFS          | boolean | If true, the DB will only operate on an in-memory filesystem.                        | No            | false   |
| DB_USERNAME           | string  | Enables auth for client to provide when connecting. DB_PASSWORD must also be valued. | Conditionally | N/A     |
| DB_PASSWORD           | string  | Enables auth for client to provide when connecting. DB_USERNAME must also be valued  | Conditionally | N/A     |
| READ_BUFFER_BYTE_SIZE | int     | Used to control the highWaterMark for readStreams. Can be left as default.           | No            | 16384   |

See also `dotenv/README.md` for info regarding config during local development.

## How does it work?

The server maintains a hashmap in memory containing `offset` values,  
which are basically pointers to the location of the corresponding value within a `segment` file that has been written to disk.

Every write ("set" command) that takes place is appended to the segment file.

Values are written to disk as a buffer that contains two parts:

1. The `recordLength` is stored as a 32-bit integer (`UInt32LE`).
2. This is immediately followed by a `utf8`-encoded JSON string of the record (key-value pair) itself.

The offsets stored by the memory map point to the start of the `recordLength`,  
so when reading a value, we can check this value then buffer through the file until we have read the whole record.

Each additional write updates the memory map to point to the latest value for a particular key.

This means that keys are duplicated within the file, so a compaction process must occur occasionally to clean up the filesystem.

**This is not implemented yet!**

### Client

The client and server communicate using [socket.io](https://www.npmjs.com/package/socket.io).

The client uses an async-await / promise-based API.

### Limitations

- Key must be a string (for now).

## Tests

- Run unit tests

  ```sh
  npm test
  ```

- Browse test coverage

  ```sh
  npm run coverage
  ```

## TODO

Where to start...

- Increase test coverage.
- Undergo performance testing.
- Implement request queue (if needed).
- Implement compaction strategy.
- Add auth.
- Add more config options.
