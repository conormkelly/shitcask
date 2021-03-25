# shitcask

_I can't believe it's not [Bitcask](https://en.wikipedia.org/wiki/Bitcask)_

## About

This project is a reverse-engineered implementation of Bitcask, purely based on the descriptions from chapter 3 of the excellent book, [Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems](https://www.amazon.co.uk/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321) by Martin Kleppmann.

## How do I use it?

1. `npm run local`
2. Send a `POST` request to `http://localhost:8000/`

- To SET a value, provide both key and value in the request:

  ```json
  {
    "key": "myKey",
    "value": ["anythingAtAll", { "whatsoever": true }]
  }
  ```

- To GET a value, provide KEY only:

  ```json
  {
    "key": "myKey"
  }
  ```

## How does it work?

This is just an Express API that maintains a hashmap in memory containing `offset` values,
which are basically pointers to the location of a value within a `segment` file that has been written to disk.

The segment file is harcoded for now but will be dynamically compacted in future.

### More info

- [Bitcask on Wikipedia](https://en.wikipedia.org/wiki/Bitcask)
