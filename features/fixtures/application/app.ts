import { Backend, KuzzleRequest } from 'kuzzle';

import { DeviceManagerPlugin } from '../../../index';
import { DummyTempDecoder, DummyTempPositionDecoder } from './decoders';
import { registerTestPipes } from './testPipes'
import { TreeNodeController } from '../fakeclasses/TreeNodeController';

const app = new Backend('kuzzle');

const deviceManager = new DeviceManagerPlugin();

deviceManager.decoders.register(new DummyTempDecoder());
deviceManager.decoders.register(new DummyTempPositionDecoder());

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

registerTestPipes(app); //TODO : move this line in another filer

app.plugin.use(deviceManager);

app.hook.register('request:onError', async (request: KuzzleRequest) => {
  app.log.error(request.error);
});

app.config.set('plugins.kuzzle-plugin-logger.services.stdout.level', 'debug');

// Reduce writing latency since we won't have significant load
app.config.set('plugins.device-manager.writerInterval', 1);

app.config.set('limits.documentsWriteCount', 5000);

const treeNodeController = new TreeNodeController(deviceManager);
deviceManager.api['device-manager/treeNode'] = treeNodeController.definition;

app.start()
  .then(() => {
    treeNodeController['context'] = deviceManager.context;
    app.log.info('Application started');
  })
  .catch(console.error);
