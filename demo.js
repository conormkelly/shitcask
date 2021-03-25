const shitcaskClient = require('./client').default;

async function main() {
  await shitcaskClient.connect({ url: 'http://localhost:8081/' });

  const valuesToGet = ['123', null, 'xyz', undefined, 3, 'XYZ'];

  // Try to get values in the above array and log the time taken
  for (const val of valuesToGet) {
    console.time(`${val} - get`);
    const value = await shitcaskClient.get(val);
    console.timeEnd(`${val} - get`);
    console.log(value);
  }

  await shitcaskClient.disconnect();
}

main();
