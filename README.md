# shitcask

_I can't believe it's not [Bitcask](https://en.wikipedia.org/wiki/Bitcask)_...

## About

### What is this?

- A pure Node.js database server and client.
- Loosely-based on Bitcask, reverse-engineered purely based on the descriptions from chapter 3 of the excellent book, [Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems](https://www.amazon.co.uk/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321) by Martin Kleppmann.
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

## How does it work?

The server maintains a hashmap in memory containing `offset` values,
which are basically pointers to the location of the corresponding value within a `segment` file that has been written to disk.

The client and server communicate using [socket.io](https://www.npmjs.com/package/socket.io).

The client uses an async-await / promise-based API.

## TODO

Where to start...

- Add tests.
- Undergo performance testing.
- Implement request queue.
- Implement compaction strategy.
- Add auth.


