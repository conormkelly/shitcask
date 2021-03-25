# shitcask

_I can't believe it's not [Bitcask](https://en.wikipedia.org/wiki/Bitcask)_...

## About

### What is this?

- A pure Nodejs database server and client.
- A reverse-engineered implementation of Bitcask, purely based on the descriptions from chapter 3 of the excellent book, [Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems](https://www.amazon.co.uk/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321) by Martin Kleppmann.
- A work in progress.

## How do I use it?

1. Start the server via: `npm run local`
2. `node ./demo.js` to run the demo client queries.

_The client will be split into a separate repo in future._

## How does it work?

The server maintains a hashmap in memory containing `offset` values,
which are basically pointers to the location of the corresponding value within a `segment` file that has been written to disk.

The client and server communicate using [socket.io](https://www.npmjs.com/package/socket.io).

The client uses an async-await / promise-based API.

_The segment file is hardcoded for now but will be dynamically compacted in future._

### More info

- [Bitcask on Wikipedia](https://en.wikipedia.org/wiki/Bitcask)
