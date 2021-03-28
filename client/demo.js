const shitcaskClient = require('./client').default;

async function main () {
  const socketId = await shitcaskClient.connect({
    url: 'http://localhost:8081/'
  });

  console.log('The socketId is', socketId, '\n');

  const keysToLookup = ['coolBeans', '123', undefined, 3, 'friendship'];

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
