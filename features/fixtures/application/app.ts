import set from 'lodash/set'; 
import { Backend, KuzzleRequest } from 'kuzzle';

import { DeviceManagerPlugin } from '../../../index';
import { DummyTempDecoder, DummyTempPositionDecoder } from './decoders';

const app = new Backend('kuzzle');

const deviceManager = new DeviceManagerPlugin();

deviceManager.registerDecoder(new DummyTempDecoder());
deviceManager.registerDecoder(new DummyTempPositionDecoder());

// Register commons properties
deviceManager.devices.registerMeasure('humidity', {
  value: { type: 'float' },
});

deviceManager.devices.registerQoS({
  battery: { type: 'integer' }
});
deviceManager.devices.registerQoS({
  battery2: { type: 'integer' }
});

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


// Register a pipe to enrich a tenant asset
app.pipe.register(`tenant:tenant-ayse:asset:measures:new`, async (request: KuzzleRequest) => {
  if (request.result.asset._id !== 'MART-linked') {
    return request;
  }

  request.result.asset._source.metadata = {
    enriched: true,
    measureTypes: request.result.measureTypes
  };

  return request;
});

app.pipe.register('device-manager:device:update:before', async ({ device, updates }) => {
  app.log.debug('before device update triggered');

  set(updates, 'metadata.enrichedByBeforeUpdateDevice', true);

  return { device, updates }
})

app.pipe.register('device-manager:device:update:after', async ({ device, updates }) => {
  app.log.debug('after device update triggered');


  if (updates.metadata.enrichedByBeforeUpdateDevice) {
    set(updates, 'metadata.enrichedByAfterUpdateDevice', true);

    console.log('device,updates', device, updates);

    app.sdk.document.update(
      device._source.tenantId,
      'devices',
      device._id,
      updates,
    );
  }


  return { device, updates }
})

app.pipe.register('device-manager:device:link-asset:before', async ({ device, asset }) => {
  app.log.debug('before link-asset triggered');

  set(asset, 'body.metadata.enrichedByBeforeLinkAsset', true);

  return { device, asset };
})

app.pipe.register('device-manager:device:link-asset:after', async ({ device, asset }) => {
  app.log.debug('after link-asset triggered');

  return { device, asset };
})

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
