const shitcaskClient = require('./client').default;

const PORT = process.env.DB_SERVER_PORT || 8091;

async function main () {
  console.log('DB_SERVER_PORT:', PORT);

  const socketId = await shitcaskClient.connect({
    url: `http://localhost:${PORT}`,
    auth: {
      username: 'test',
      password: 'test'
    }
  });

  console.log('The socketId is', socketId, '\n');

  const keysToLookup = ['coolBeans', '123', null, undefined, 123, 'coolBeans'];

  console.log(
    `Get keys: ${JSON.stringify(keysToLookup)}, and log the time taken:\n`
  );

  for (const key of keysToLookup) {
    console.time(`Key: ${key}`);
    const value = await shitcaskClient.get(key);
    console.timeEnd(`Key: ${key}`);
    console.log('Response:', value, '\n');
  }

  console.log('Set a value and log the time taken:\n');

  console.time('set "coolBeans"');
  const response = await shitcaskClient.set('coolBeans', { coolBeans: true });
  console.timeEnd('set "coolBeans"');

  console.log(response);

  await shitcaskClient.disconnect();
}

main();
