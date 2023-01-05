const { Kuzzle, WebSocket } = require('kuzzle-sdk');

const startScope = process.env.START_SCOPE || 0;
const hostname = process.env.KUZZLE_HOST || 'localhost';
const port = process.env.KUZZLE_PORT || 7512;
const username = process.env.KUZZLE_USERNAME;
const password = process.env.KUZZLE_PASSWORD;

const kuzzle = new Kuzzle(new WebSocket(hostname, { port }));

async function run () {
  try {
    await kuzzle.connect();

    if (username && password) {
      await kuzzle.auth.login('local', { username, password });
    }

    const promises = [];
    let count = 10;

    let total = 5000;

    const start = Date.now();
    while (total) {
      for (let i = startScope; i < startScope + 1000; i++) {
        promises.push(kuzzle.query({
          controller: 'device-manager/payload',
          action: 'dummy-temp',
          body: {
            deviceEUI: 'serial-' + i,
            register55: count,
            batteryLevel: 0.42
          }
        }).catch(console.error));
        total -= 1;

        await new Promise(resolve => setTimeout(resolve, 1));
      }

      count += 1;
    }

    await Promise.all(promises);

    const time = Date.now() - start;
    console.log('Send 5000 req in ', time, 'ms (', 5000 / (time/1000).toFixed(1), ' req/s)');
    kuzzle.disconnect();
  }
  catch (error) {
    console.error(error);
  }
}

run();