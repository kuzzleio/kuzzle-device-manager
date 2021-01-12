import { Backend, KuzzleRequest } from 'kuzzle';
import { DeviceManager } from './lib/DeviceManager';

const app = new Backend('device-management');

app._support.mappings = require('./fixtures/mappings.json');
app._support.fixtures = require('./fixtures/fixtures.json');

app.plugin.use(new DeviceManager(app));

app.hook.register('request:onError', async (request: KuzzleRequest) => {
  app.log.error(request.error);
});

app.config.set('plugins.kuzzle-plugin-logger.services.stdout.level', 'debug');

app.start()
  .then(() => {
    app.log.info('Application started')
  })
  .catch(console.error);
