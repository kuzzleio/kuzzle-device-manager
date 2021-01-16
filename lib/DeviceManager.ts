import {
  Plugin,
  PluginContext,
  JSONObject,
  EmbeddedSDK,
  InternalError,
  PluginImplementationError,
} from 'kuzzle';

import { AssetsController } from './controllers/AssetsController';
import { SensorsController } from './controllers/SensorsController';
import { EnginesController } from './controllers/EnginesController';
import { PayloadService } from './services/PayloadService';
import { Decoder } from './decoders/Decoder';
import { sensorsMappings } from './models/Sensor';

export class DeviceManager extends Plugin {
  private defaultConfig: JSONObject;

  private assetsController: AssetsController;
  private sensorsController: SensorsController;
  private enginesController: EnginesController;
  private payloadService: PayloadService;

  private get sdk(): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  /**
   * Define custom mappings
   */
  public mappings: {
    /**
     * Define custom mappings for the "sensors" collection.
     * @todo apply inside the "assets" collection
     */
    sensors: {
      /**
       * Define custom mappings for the "sensors.metadata" property
       */
      metadata: JSONObject;
      /**
       * Define custom mappings for the "sensors.measures" property
       */
      measures: JSONObject;
    },
  }

  /**
   * List of registered decoders.
   * Map<model, decoder>
   */
  private decoders = new Map<string, Decoder>();

  /**
   * Constructor
   */
  constructor() {
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
      },
      collections: {
        // assets collection
        assets: {
          dynamic: 'strict',
          properties: {
            model: { type: 'keyword' },
            reference: { type: 'keyword' },
            measures: {
              properties: {
                position: {
                  properties: {
                    id: { type: 'keyword' },
                    manufacturerId: { type: 'keyword' },
                    model: { type: 'keyword' },
                    latitude: { type: 'float' },
                    longitude: { type: 'float' },
                    altitude: { type: 'float' },
                    accuracy: { type: 'integer' },
                    updatedAt: { type: 'date' },
                    payloadUuid: { type: 'keyword' },
                    metadata: {
                      dynamic: 'false',
                      properties: {}
                    }
                  },
                },
                temperature: {
                  properties: {
                    id: { type: 'keyword' },
                    manufacturerId: { type: 'keyword' },
                    model: { type: 'keyword' },
                    updatedAt: { type: 'date' },
                    payloadUuid: { type: 'keyword' },
                    value: { type: 'float' },
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
        // sensors-history collection
        'sensors-history': sensorsMappings,
      }
    };
  }

  /**
   * Init the plugin
   *
   * @param config
   * @param context
   */
  async init(config: JSONObject, context: PluginContext) {
    this.config = { ...this.defaultConfig, ...config };
    this.context = context;

    this.mergeCustomMappings();

    this.assetsController = new AssetsController(context);
    this.sensorsController = new SensorsController(this.config, context, this.decoders);
    this.enginesController = new EnginesController(this.config, context);

    this.payloadService = new PayloadService(this.config, context);

    this.api['device-manager/assets'] = this.assetsController.definition;
    this.api['device-manager/sensors'] = this.sensorsController.definition;
    this.api['device-manager/engines'] = this.enginesController.definition;

    await this.initDatabase();

    for (const decoder of Array.from(this.decoders.values())) {
      this.context.log.info(`Register API action "device-manager/payloads:${decoder.action}" with decoder for sensor "${decoder.sensorModel}"`);
    }
  }

  /**
   * Register a new decoder for a sensor model.
   *
   * This will register a new API action:
   *  - controller: "device-manager/payloads"
   *  - action: "action" property of the decoder or the sensor model in kebab-case
   *
   * @param decoder Instantiated decoder
   *
   * @returns Corresponding API action requestPayload
   */
  registerDecoder(decoder: Decoder): { controller: string, action: string } {
    decoder.action = decoder.action || kebabCase(decoder.sensorModel);

    if (this.api['device-manager/payloads'].actions[decoder.action]) {
      throw new PluginImplementationError(`A decoder for "${decoder.sensorModel}" has already been registered.`);
    }

    this.api['device-manager/payloads'].actions[decoder.action] = {
      handler: request => this.payloadService.process(request, decoder),
      http: decoder.http,
    };

    this.decoders.set(decoder.sensorModel, decoder);

    return {
      controller: 'device-manager/payloads',
      action: decoder.action,
    };
  }

  /**
   * Initialize the administration index of the plugin
   */
  private async initDatabase() {
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

  private mergeCustomMappings() {
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

function kebabCase(string) {
  return string
    // get all lowercase letters that are near to uppercase ones
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    // replace all spaces and low dash
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
