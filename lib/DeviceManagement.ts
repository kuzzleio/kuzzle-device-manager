import {
  Plugin,
  PluginContext,
  JSONObject
} from 'kuzzle';
import { AssetController } from './controllers/AssetController';
import { SensorController } from './controllers/SensorController';

export class DeviceManagement extends Plugin {
  private assetController: AssetController;
  private sensorController: SensorController;

  /**
   * Constructor
   */
  constructor () {
    super({
      kuzzleVersion: '>=2.8.0 <3'
    });
  }

  /**
   * Init the plugin
   * 
   * @param config 
   * @param context 
   */
  async init (config: JSONObject, context: PluginContext) {
    this.config = config;
    this.context = context;

    this.assetController = new AssetController(context);
    this.sensorController = new SensorController(context);

    this.api = {
      'device-manager/asset': this.assetController.definition,
      'device-manager/sensor': this.sensorController.definition
    };
  }
}
