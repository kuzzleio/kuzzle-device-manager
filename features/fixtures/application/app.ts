import { Backend, KuzzleRequest } from 'kuzzle';

import { DeviceManagerPlugin } from '../../../index';
import { DummyTempDecoder, DummyTempPositionDecoder } from './decoders';

const app = new Backend('kuzzle');

const deviceManager = new DeviceManagerPlugin();

deviceManager.registerDecoder(new DummyTempDecoder());
deviceManager.registerDecoder(new DummyTempPositionDecoder());

deviceManager.mappings.sensors.measures = {
  humidity: {
    properties: {
      updatedAt: { type: 'date' },
      payloadUuid: { type: 'keyword' },
      value: { type: 'float' },
    }
  }
};

deviceManager.mappings.sensors.qos = {
  battery: { type: 'integer' }
};

deviceManager.mappings.sensors.metadata = {
  group: { type: 'keyword' }
};

deviceManager.mappings.assets.metadata = {
  warranty: { type: 'keyword' }
};

app.plugin.use(deviceManager);

app.hook.register('request:onError', async (request: KuzzleRequest) => {
  app.log.error(request.error);
});

app.config.set('plugins.kuzzle-plugin-logger.services.stdout.level', 'debug');

app.start()
  .then(() => {
    app.log.info('Application started');
  })
  .catch(console.error);
