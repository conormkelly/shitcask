const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const socketIo = require('socket.io');

const logger = require('./logger');

class SocketService {
  constructor (app, config) {
    // Create server
    logger.info('Server: Creating...');

    this.DB_SERVER_PORT = config.DB_SERVER_PORT;

    const TLS_ENABLED =
      config.DB_TLS_KEY_PATH !== undefined &&
      config.DB_TLS_CERT_PATH !== undefined;

    if (TLS_ENABLED) {
      logger.info('TLS: ENABLED');
      this.server = https.createServer(
        {
          key: fs.readFileSync(path.resolve(config.DB_TLS_KEY_PATH)),
          cert: fs.readFileSync(path.resolve(config.DB_TLS_CERT_PATH)),
          rejectUnauthorized: false
        },
        app
      );
    } else {
      logger.warn('TLS: DISABLED');
      logger.warn('TLS: Provide DB_TLS_KEY_PATH and DB_TLS_CERT_PATH.');
      this.server = http.createServer(app);
    }

    this.io = socketIo(this.server);

    const AUTH_ENABLED =
      config.DB_USERNAME !== undefined && config.DB_PASSWORD !== undefined;

    if (AUTH_ENABLED) {
      logger.info('Auth: ENABLED');
      this.io.use((socket, next) => {
        logger.info(
          `Authenticating: ${socket.id} (Address: ${socket.handshake.address})`
        );

        const { auth } = socket.handshake;
        if (
          auth.username === config.DB_USERNAME &&
          auth.password === config.DB_PASSWORD
        ) {
          next();
          logger.info(`Authorized: ${socket.id}`);
        } else {
          // Generates connect_failed event on the client
          const err = new Error(
            'Invalid username / password combination provided.'
          );
          err.data = { code: 'AUTH_FAILED' };
          next(err);
          logger.info(`Unauthorized: ${socket.id}`);
        }
      });
    } else {
      logger.warn('AUTH: DISABLED');
      logger.warn(
        'AUTH: It is strongly recommended to set DB_USERNAME and DB_PASSWORD.'
      );
    }
  }

  addConnectionListener (listener) {
    this.io.on('connection', listener);
  }

  listen (callback) {
    this.io.listen(this.DB_SERVER_PORT, callback);
  }
}

module.exports = SocketService;
