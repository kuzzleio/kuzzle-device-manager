import {
  KuzzleRequest,
  KuzzlePlugin,
  PluginContext,
  JSONObject,
} from 'kuzzle';

export class DeviceManagement extends KuzzlePlugin {
  constructor () {
    super({
      kuzzleVersion: '>=2.8.0 <3'
    });
  }

  async init (config: JSONObject, context: PluginContext) {
    this.config = config;
    this.context = context;
  }
}
