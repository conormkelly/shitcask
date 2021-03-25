const socketIOClient = require('socket.io-client');

/**
 * Async client to connect to a `shitcask` server.
 *
 * The instance must be connected before attempting to `get` or `set` values.
 */
class ShitCaskClient {
  /**
   * @param {socketIOClient} io
   */
  constructor(io) {
    this.io = io;
  }

  /**
   * Connect to a shitcask server.
   * @param {{url: string}} config
   * @returns {Promise<void>}
   */
  async connect({ url }) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isConnected()) {
          this.socket = this.io(url);
          this.socket.on('connect', () => {
            resolve();
          });
        } else {
          throw new Error('Client is already connected!');
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Check whether the client is connected.
   * @returns {boolean}
   */
  isConnected() {
    return this.socket === undefined ? false : this.socket.connected;
  }

  /**
   * Disconnect from the server.
   * @returns {Promise<void>}
   */
  async disconnect() {
    return new Promise((resolve, reject) => {
      try {
        if (this.isConnected()) {
          this.socket.disconnect();
          this.socket.on('disconnect', () => {
            resolve();
          });
        } else {
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get a key value.
   * @param {*} key
   * @returns {{success: true, value: any} | {success: false, message: string}}
   */
  async get(key) {
    return new Promise((resolve, reject) => {
      try {
        this.socket.emit('get', { key }, (response) => {
          resolve(response);
        });
      } catch (err) {
        if (!this.isConnected()) {
          reject(new Error('shitcask is not connected!'));
        } else {
          reject(err);
        }
      }
    });
  }

  /**
   * Set a key-value pair.
   * @param {any} key
   * @param {any} value
   * @returns {{success: true } | {success: false, message: string}}
   *
   */
  async set(key, value) {
    return new Promise((resolve, reject) => {
      try {
        this.socket.emit('set', { key, value }, (response) => {
          resolve(response);
        });
      } catch (err) {
        if (!this.isConnected()) {
          reject(new Error('shitcask is not connected!'));
        } else {
          reject(err);
        }
      }
    });
  }
}

const client = new ShitCaskClient(socketIOClient);

module.exports = {
  default: client,
  ShitCaskClient,
};
