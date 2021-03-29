# dotenv

Used to conveniently set environment variables during development,  
without adding a runtime dependency on dotenv.

## Setup

Required for **local development only**.

1. Copy the `.env.example` file in the project root and rename the new file as `.env`.

   ```sh
   # You can do this manually or run...
   cp .env.example .env
   ```

   This file is gitignored.

2. Modify the values in the `.env` file to configure them.

   ```env
   DB_SERVER_PORT=5000
   DB_DATA_DIR=C:/whatever/dir/you/want
   ```

3. Start the server via `npm run local`.

   It will load the environment variable values defined here.

## More info

- [John Papa's excellent article on environment variables in Node](https://medium.com/the-node-js-collection/making-your-node-js-work-everywhere-with-environment-variables-2da8cdf6e786).
