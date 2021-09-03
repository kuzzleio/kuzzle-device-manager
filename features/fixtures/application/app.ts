import { Backend, KuzzleRequest } from 'kuzzle';

import { DeviceManagerPlugin } from '../../../index';
import { DummyTempDecoder, DummyTempPositionDecoder } from './decoders';

const app = new Backend('kuzzle');

const deviceManager = new DeviceManagerPlugin();

deviceManager.registerDecoder(new DummyTempDecoder());
deviceManager.registerDecoder(new DummyTempPositionDecoder());

// Register commons properties
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

deviceManager.devices.registerQos({
  battery: { type: 'integer' }
});

deviceManager.devices.registerMetadata({
  group: {
    type: 'keyword',
    fields: {
      text: { type: 'text' }
    }
  }
});

deviceManager.assets.registerMetadata({
  warranty: {
    type: 'keyword',
    fields: {
      text: { type: 'text' }
    }
  }
});

// Register properties for "astronaut" tenant group
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
}, { group: 'astronaut' });

deviceManager.devices.registerMeasure('acceleration', {
  properties: {
    updatedAt: { type: 'date' },
    payloadUuid: {
      type: 'keyword',
      fields: {
        text: { type: 'text' }
      }
    },
    acceleration: { type: 'float' },
  }
}, { group: 'astronaut' });


deviceManager.devices.registerQos({
  durability: { type: 'float' }
}, { group: 'astronaut' });

deviceManager.devices.registerQos({
  signalStrenght: { type: 'float' }
}, { group: 'astronaut' });


deviceManager.devices.registerMetadata({
  awake: { type: 'boolean' }
}, { group: 'astronaut' });

deviceManager.devices.registerMetadata({
  sleeping: { type: 'boolean' }
}, { group: 'astronaut' });


deviceManager.assets.registerMetadata({
  stillAlive: { type: 'boolean' }
}, { group: 'astronaut' });

deviceManager.assets.registerMetadata({
  freezing: { type: 'boolean' }
}, { group: 'astronaut' });

app.plugin.use(deviceManager);

app.hook.register('request:onError', async (request: KuzzleRequest) => {
  app.log.error(request.error);
});

app.config.set('plugins.kuzzle-plugin-logger.services.stdout.level', 'debug');
// app.config.set('limits.documentsWriteCount', 20);

/**
 * Register pipe for scenario used to test the tenant specific event propagation
 */
app.pipe.register('tenant:tenant-ayse:device:new-payload', async eventParam => {
  await app.sdk.realtime.publish('tests', 'messages', eventParam.result);

  return eventParam;
});

app.config.set('limits.documentsWriteCount', 5000);

app.start()
  .then(() => {
    app.log.info('Application started');
  })
  .catch(console.error);
