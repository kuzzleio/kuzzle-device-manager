import { Backend, KuzzleRequest } from 'kuzzle';
import { DeviceManagement } from './lib/DeviceManagement';

const app = new Backend('kuzzle');

const deviceManagement = new DeviceManagement();

app.plugin.use(deviceManagement);

app.hook.register('request:onError', async (request: KuzzleRequest) => {
  app.log.error(request.error);
});

app.config.set('plugins.kuzzle-plugin-logger.services.stdout.level', 'debug');

app.start()
  .then(() => {
    app.log.info('Application started')
  })
  .catch(console.error);
