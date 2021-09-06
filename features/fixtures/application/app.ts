import { Backend, KuzzleRequest } from 'kuzzle';

import { DeviceManagerPlugin } from '../../../index';
import { DummyTempDecoder, DummyTempPositionDecoder } from './decoders';

const app = new Backend('kuzzle');

const deviceManager = new DeviceManagerPlugin();

deviceManager.registerDecoder(new DummyTempDecoder());
deviceManager.registerDecoder(new DummyTempPositionDecoder());

deviceManager.devices.registerMeasure('humidity', {
  properties: {
    updatedAt: { type: 'date' },
    payloadUuid: {
      type: 'keyword',
      fields: {
        text: { type: 'text' }
      }
    },
    value: { type: 'float' },
  }
});

deviceManager.devices.registerMeasure('gravity', {
  properties: {
    updatedAt: { type: 'date' },
    payloadUuid: {
      type: 'keyword',
      fields: {
        text: { type: 'text' }
      }
    },
    value: { type: 'float' },
  }
}, { tenantGroup: 'astronaut' });

deviceManager.devices.registerQos({
  battery: { type: 'integer' }
});

deviceManager.devices.registerQos({
  durability: { type: 'float' }
}, { tenantGroup: 'astronaut' });

deviceManager.devices.registerMetadata({
  group: {
    type: 'keyword',
    fields: {
      text: { type: 'text' }
    }
  }
});

deviceManager.devices.registerMetadata({
  awake: { type: 'boolean' }
}, { tenantGroup: 'astronaut' });

deviceManager.assets.registerMetadata({
  warranty: {
    type: 'keyword',
    fields: {
      text: { type: 'text' }
    }
  }
});

deviceManager.assets.registerMetadata({
  stillAlive: { type: 'boolean' }
}, { tenantGroup: 'astronaut' });

app.plugin.use(deviceManager);

app.hook.register('request:onError', async (request: KuzzleRequest) => {
  app.log.error(request.error);
});

app.config.set('plugins.kuzzle-plugin-logger.services.stdout.level', 'debug');
app.config.set('limits.documentsWriteCount', 20);

app.start()
  .then(() => {
    app.log.info('Application started');
  })
  .catch(console.error);
