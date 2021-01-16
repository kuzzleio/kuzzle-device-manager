import { Backend, KuzzleRequest } from 'kuzzle';

import { DeviceManager } from './lib/DeviceManager';
import { DummyTempDecoder } from './features/fixtures/decoders/DummyTempDecoder';
import { DummyTempPositionDecoder } from './features/fixtures/decoders/DummyTempPositionDecoder';

const app = new Backend('kuzzle');

const deviceManager = new DeviceManager();

deviceManager.registerDecoder(new DummyTempDecoder());
deviceManager.registerDecoder(new DummyTempPositionDecoder());

app.plugin.use(deviceManager);

app.hook.register('request:onError', async (request: KuzzleRequest) => {
  app.log.error(request.error);
});

app.config.set('plugins.kuzzle-plugin-logger.services.stdout.level', 'debug');

app.start()
  .then(() => {
    app.log.info('Application started')
  })
  .catch(console.error);
