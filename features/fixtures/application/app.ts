import { Backend, KuzzleRequest } from 'kuzzle';

import { DeviceManagerPlugin } from '../../../index';
import {
  DummyMultiTempDecoder,
  DummyTempDecoder,
  DummyTempPositionDecoder,
} from './decoders';
import { registerTestPipes } from './testPipes'

const app = new Backend('kuzzle');

const deviceManager = new DeviceManagerPlugin();

deviceManager.decoders.register(new DummyTempDecoder(deviceManager.measures));
deviceManager.decoders.register(new DummyMultiTempDecoder(deviceManager.measures));
deviceManager.decoders.register(new DummyTempPositionDecoder(deviceManager.measures));

deviceManager.devices.registerMetadata({
  group: {
    type: 'keyword',
    fields: {
      text: { type: 'text' }
    }
  }
});

deviceManager.devices.registerMetadata({
  group2: {
    type: 'keyword',
    fields: {
      text: { type: 'text' }
    }
  }
});

deviceManager.assets.register('car', {
  warranty: {
    type: 'keyword',
    fields: {
      text: { type: 'text' }
    }
  }
});

// Register an asset for the "astronaut" group

deviceManager.assets.register('rocket', {
  stillAlive: { type: 'boolean' }
}, { group: 'astronaut' });

deviceManager.assets.register('hevSuit', {
  freezing: { type: 'boolean' }
}, { group: 'astronaut' });

registerTestPipes(app);

app.plugin.use(deviceManager);

app.hook.register('request:onError', async (request: KuzzleRequest) => {
  app.log.error(request.error);
});

app.config.set('plugins.kuzzle-plugin-logger.services.stdout.level', 'debug');

// Reduce writing latency since we won't have significant load
app.config.set('plugins.device-manager.writerInterval', 1);

app.config.set('limits.documentsWriteCount', 5000);

app.start()
  .then(() => {
    app.log.info('Application started');
  })
  .catch(console.error);
