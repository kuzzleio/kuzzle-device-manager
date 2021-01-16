import {
  Plugin,
  PluginContext,
  JSONObject,
  EmbeddedSDK,
  InternalError,
  PluginImplementationError,
} from 'kuzzle';

import { AssetController } from './controllers/AssetController';
import { SensorController } from './controllers/SensorController';
import { EngineController } from './controllers/EngineController';
import { PayloadService } from './services/PayloadService';
import { Decoder } from './decoders/Decoder';
import { sensorsMappings } from './models/Sensor';

export class DeviceManager extends Plugin {
  public defaultConfig: JSONObject;

  private assetController: AssetController;
  private sensorController: SensorController;
  private engineController: EngineController;
  private payloadService: PayloadService;

  public mappings: {
    sensors: {
      metadata: JSONObject;
      measures: JSONObject;
    },
  }

  /**
   * List of registered decoders.
   * Map<action, decoder>
   */
  private decoders = new Map<string, Decoder>();

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

    this.mappings = {
      sensors: {
        metadata: {},
        measures: {}
      }
    };

    this.api = {
      'device-manager/payloads': {
        actions: {}
      }
    };

    this.defaultConfig = {
      adminIndex: 'device-manager',
      adminCollections: {
        engines: {
          dynamic: 'strict',
          properties: {
            index: { type: 'keyword' },
          }
        },
        sensors: sensorsMappings,
        'sensors-history': sensorsMappings
      },
      collections: {
        // assets collection
        assets: {
          dynamic: 'strict',
          properties: {
            model: { type: 'keyword' },
            reference: { type: 'keyword' },
            sensors: {
              properties: {
                position: {
                  properties: {
                    manufacturerId: { type: 'keyword' },
                    model: { type: 'keyword' },
                    measure: {
                      properties: {
                        latitude: { type: 'float' },
                        longitude: { type: 'float' },
                        altitude: { type: 'float' },
                        accuracy: { type: 'integer' },
                        updatedAt: { type: 'date' },
                        payloadUuid: { type: 'keyword' }
                      }
                    },
                    metadata: {
                      dynamic: 'false',
                      properties: {}
                    }
                  },
                },
                temperature: {
                  properties: {
                    manufacturerId: { type: 'keyword' },
                    model: { type: 'keyword' },
                    measure: { type: 'float' },
                    metadata: {
                      dynamic: 'false',
                      properties: {}
                    }
                  }
                },
              }
            },
          }
        },
        // sensors collection
        sensors: sensorsMappings,
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

    this.mergeCustomMappings();

    this.assetController = new AssetController(context);
    this.sensorController = new SensorController(context);
    this.engineController = new EngineController(this.config, context);

    this.payloadService = new PayloadService(this.config, context);

    this.api['device-manager/asset'] = this.assetController.definition;
    this.api['device-manager/sensor'] = this.sensorController.definition;
    this.api['device-manager/engine'] = this.engineController.definition;

    await this.initDatabase();

    for (const [action, decoder] of Array.from(this.decoders.entries())) {
      this.context.log.info(`Register API action "device-manager/payloads:${action}" with decoder for sensor "${decoder.sensorModel}"`);
    }
  }

  registerDecoder (decoder: Decoder) {
    const action = decoder.action || kebabCase(decoder.sensorModel);

    if (this.api['device-manager/payloads'].actions[action]) {
      throw new PluginImplementationError(`A decoder for "${decoder.sensorModel}" has already been registered.`);
    }

    this.api['device-manager/payloads'].actions[action] = {
      handler: request => this.payloadService.process(request, decoder),
      http: decoder.http,
    };

    this.decoders.set(action, decoder);

    return {
      controller: 'device-manager/payloads',
      action,
    };
  }

  /**
   * Initialize the administration index of the plugin
   */
  private async initDatabase () {
    // @todo need mutex
    try {
      await this.sdk.index.create(this.config.adminIndex);
    }
    catch (error) {
      if (error.id !== 'services.storage.index_already_exists') {
        throw new InternalError(`Cannot initialize plugin database: ${error}`);
      }
    }

    await Promise.all([
      this.sdk.collection.create(
        this.config.adminIndex,
        'engines',
        { mappings: this.config.adminCollections.engines }),
      this.sdk.collection.create(
        this.config.adminIndex,
        'sensors',
        { mappings: this.config.adminCollections.sensors })
      ]);
  }

  private mergeCustomMappings () {
    this.config.collections.sensors.properties.metadata.properties = {
      ...this.config.collections.sensors.properties.metadata.properties,
      ...this.mappings.sensors.metadata,
    };

    this.config.collections.sensors.properties.measures.properties = {
      ...this.config.collections.sensors.properties.measures.properties,
      ...this.mappings.sensors.measures,
    };
  }
}

function kebabCase (string) {
  return string
  // get all lowercase letters that are near to uppercase ones
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    // replace all spaces and low dash
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
