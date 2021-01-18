import {
  Plugin,
  PluginContext,
  JSONObject,
  EmbeddedSDK,
  InternalError,
} from 'kuzzle';

import { AssetController } from './controllers/AssetController';
import { SensorController } from './controllers/SensorController';
import { EngineController } from './controllers/EngineController';
import { FrontController } from './controllers/FrontController';

export class DeviceManager extends Plugin {
  private assetController: AssetController;
  private sensorController: SensorController;
  private engineController: EngineController;
  private frontController: FrontController;
  private defaultConfig: JSONObject;

  private get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  /**
   * Constructor
   */
  constructor () {
    super({
      kuzzleVersion: '>=2.8.0 <3'
    });

    this.defaultConfig = {
      adminIndex: 'device-manager',
      adminCollections: {
        engines: {
          dynamic: 'strict',
          properties: {
            index: { type: 'keyword' },
          }
        },
      },
      collections: {
        asset: {
          dynamic: 'strict',
          properties: {
            sensorId: { type: 'keyword' },
            name: { type: 'keyword' },
          }
        },
        sensor: {
          dynamic: 'strict',
          properties: {
            assetId: { type: 'keyword' },
            name: { type: 'keyword' },
          }
        },
        measurement: {
          dynamic: 'strict',
          properties: {
            metadata: {
              properties: {
                sensorId: { type: 'keyword' },
                assetId: { type: 'keyword' },
              }
            },
            type: { type: 'keyword' },
            value: { type: 'keyword' },
          }
        }
      }
    };
  }

  /**
   * Init the plugin
   *
   * @param config
   * @param context
   */
  async init (config: JSONObject, context: PluginContext) {
    this.config = { ...this.defaultConfig, ...config };
    this.context = context;

    this.assetController = new AssetController(context);
    this.sensorController = new SensorController(context);
    this.engineController = new EngineController(this.config, context);
    this.frontController = new FrontController(context, 'device-manager/front/');
    await this.frontController.init(context);

    this.api = {
      'device-manager/asset': this.assetController.definition,
      'device-manager/sensor': this.sensorController.definition,
      'device-manager/engine': this.engineController.definition,
      'device-manager/front': this.frontController.definition
    };

    await this.initDatabase();
  }

  /**
   * Initialize the administration index of the plugin
   */
  private async initDatabase () {
    // @todo need mutex
    try {
      await this.sdk.index.create(this.config.adminIndex);

      await this.sdk.collection.create(
        this.config.adminIndex,
        'engines',
        { mappings: this.config.adminCollections.engines });
    }
    catch (error) {
      if (error.id !== 'services.storage.index_already_exists') {
        throw new InternalError(`Cannot initialize plugin database: ${error}`);
      }
    }
  }
}
