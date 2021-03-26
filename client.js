const socketIOClient = require('socket.io-client');

/**
 * Async client to connect to a `shitcask` server.
 *
 * The instance must be connected before attempting to `get` or `set` values.
 *
 * Default config:
 * ```json
 * {
 *   "timeoutMs": 5000
 * }
 * ```
 */
class ShitCaskClient {
  /**
   * @param {socketIOClient} io
   */
  constructor(io) {
    this.io = io;
    this.timeoutMs = 5000;
  }

  /**
   * Connect to a shitcask server.
   * @param {{url: string, timeout?: number}} config
   * @returns {Promise<void>}
   */
  async connect({ url, timeout }) {
    return new Promise((resolve, reject) => {
      if (timeout !== undefined) {
        this.timeoutMs = timeout;
      }

      try {
        if (!this.isConnected()) {
          this.socket = this.io(url);

          // socket.io will retry forever, so set a timer
          // to give up if server unavailable
          this.socket._firstConnectionTimer = setTimeout(() => {
            this.socket.close();
            reject(new Error('Initial connection timed out'));
          }, this.timeoutMs);

          this.socket.on('connect', () => {
            clearTimeout(this.socket._firstConnectionTimer);
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
