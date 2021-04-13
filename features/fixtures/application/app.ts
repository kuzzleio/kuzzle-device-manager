import { Backend, KuzzleRequest } from 'kuzzle';

import { DeviceManagerPlugin } from '../../../index';
import { DummyTempDecoder, DummyTempPositionDecoder } from './decoders';

const app = new Backend('kuzzle');

const deviceManager = new DeviceManagerPlugin();

deviceManager.registerDecoder(new DummyTempDecoder());
deviceManager.registerDecoder(new DummyTempPositionDecoder());

// deviceManager.mappings.devices.measures = {
//   humidity: {
//     properties: {
//       updatedAt: { type: 'date' },
//       payloadUuid: { type: 'keyword' },
//       value: { type: 'float' },
//     }
//   }
// };

// deviceManager.mappings.devices.qos = {
//   battery: { type: 'integer' }
// };

// deviceManager.mappings.devices.metadata = {
//   group: { type: 'keyword' }
// };

// deviceManager.mappings.assets.metadata = {
//   warranty: { type: 'keyword' }
// };

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
