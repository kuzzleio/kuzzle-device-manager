import {
  Plugin,
  PluginContext,
  JSONObject,
  EmbeddedSDK,
  PluginImplementationError,
  Mutex,
} from 'kuzzle';

import {
  AssetController,
  DeviceController,
  EngineController,
} from './controllers';

import { EngineService, PayloadService, DeviceService } from './services';
import { Decoder } from './decoders';
import { devicesMappings, assetsMappings } from './models';

export class DeviceManagerPlugin extends Plugin {
  private defaultConfig: JSONObject;

  private assetController: AssetController;
  private deviceController: DeviceController;
  private engineController: EngineController;

  private payloadService: PayloadService;
  private engineService: EngineService;
  private deviceService: DeviceService;

  private get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  /**
   * Define custom mappings for "devices" and "assets" colections
   */
  public mappings: {
    /**
     * Define custom mappings for the "devices" collection.
     */
    devices: {
      /**
       * Define custom mappings for the "devices.metadata" property
       */
      metadata: JSONObject;
      /**
       * Define custom mappings for the "devices.qos" property
       */
      qos: JSONObject;
      /**
       * Define custom mappings for the "devices.measures" property
       */
      measures: JSONObject;
    },
    /**
     * Define custom mappings for the "assets" collection.
     */
    assets: {
      /**
       * Define custom mappings for the "assets.metadata" property
       */
      metadata: JSONObject;
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
      kuzzleVersion: '>=2.11.1 <3'
    });

    this.mappings = {
      devices: {
        metadata: {},
        qos: {},
        measures: {},
      },
      assets: {
        metadata: {},
      },
    };

    this.api = {
      'device-manager/payload': {
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
        devices: devicesMappings,
        payloads: {
          dynamic: 'false',
          // @todo have API action to clean
          properties: {
            uuid: { type: 'keyword' },
            valid: { type: 'boolean' },
            deviceModel: { type: 'keyword' },
            payload: {
              properties: {}
            }
          }
        }
      },
      collections: {
        assets: assetsMappings,
        devices: devicesMappings,
      }
    };
  }

  /**
   * Init the plugin
   */
  async init (config: JSONObject, context: PluginContext) {
    this.config = { ...this.defaultConfig, ...config };
    this.context = context;

    this.mergeCustomMappings();

    this.engineService = new EngineService(this.config, context);
    this.payloadService = new PayloadService(this.config, context);
    this.deviceService = new DeviceService(this.config, context, this.decoders);
    this.assetController = new AssetController(this.config, context);
    this.engineController = new EngineController(this.config, context, this.engineService);
    this.deviceController = new DeviceController(this.config, context, this.deviceService);

    this.api['device-manager/asset'] = this.assetController.definition;
    this.api['device-manager/device'] = this.deviceController.definition;
    this.api['device-manager/engine'] = this.engineController.definition;

    await this.initDatabase();

    for (const decoder of this.decoders.values()) {
      this.context.log.info(`Register API action "device-manager/payload:${decoder.action}" with decoder "${decoder.constructor.name}" for device "${decoder.deviceModel}"`);
    }
  }

  /**
   * Registers a new decoder for a device model.
   *
   * This will register a new API action:
   *  - controller: `"device-manager/payload"`
   *  - action: `action` property of the decoder or the device model in kebab-case
   *
   * @param decoder Instantiated decoder
   *
   * @returns Corresponding API action requestPayload
   */
  registerDecoder (decoder: Decoder): { controller: string, action: string } {
    decoder.action = decoder.action || kebabCase(decoder.deviceModel);

    if (this.api['device-manager/payload'].actions[decoder.action]) {
      throw new PluginImplementationError(`A decoder for "${decoder.deviceModel}" has already been registered.`);
    }

    this.api['device-manager/payload'].actions[decoder.action] = {
      handler: request => this.payloadService.process(request, decoder),
      http: decoder.http,
    };

    this.decoders.set(decoder.deviceModel, decoder);

    return {
      controller: 'device-manager/payload',
      action: decoder.action,
    };
  }

  /**
   * Initialize the administration index of the plugin
   */
  private async initDatabase () {
    const mutex = new Mutex('device-manager/initDatabase');

    await mutex.lock();

    try {
      if (! await this.sdk.index.exists(this.config.adminIndex)) {
        await this.sdk.index.create(this.config.adminIndex);
      }
    }
    finally {
      await mutex.unlock();
    }

    await Promise.all(Object.entries(this.config.adminCollections)
      .map(([collection, mappings]) => (
        this.sdk.collection.create(this.config.adminIndex, collection, { mappings })
      ))
    );
  }

  private mergeCustomMappings () {
    // Merge devices qos custom mappings
    this.config.collections.devices.properties.qos.properties = {
      ...this.config.collections.devices.properties.qos.properties,
      ...this.mappings.devices.qos,
    };

    // Merge devices metadata custom mappings
    this.config.collections.devices.properties.metadata.properties = {
      ...this.config.collections.devices.properties.metadata.properties,
      ...this.mappings.devices.metadata,
    };

    // Merge devices measures custom mappings
    this.config.collections.devices.properties.measures.properties = {
      ...this.config.collections.devices.properties.measures.properties,
      ...this.mappings.devices.measures,
    };

    // Merge assets metadata custom mappings
    this.config.collections.assets.properties.metadata.properties = {
      ...this.config.collections.assets.properties.metadata.properties,
      ...this.mappings.assets.metadata,
    };

    // Use "devices" mappings to generate "assets" collection mappings
    // for the "measures" property
    const deviceProperties = {
      id: { type: 'keyword' },
      reference: { type: 'keyword' },
      model: { type: 'keyword' },
    };

    for (const [measureType, definition] of Object.entries(this.config.collections.devices.properties.measures.properties) as any) {
      this.config.collections.assets.properties.measures.properties[measureType] = {
        dynamic: 'false',
        properties: {
          ...deviceProperties,
          ...definition.properties,
          qos: {
            properties: this.config.collections.devices.properties.qos.properties
          }
        }
      };
    }

    // Merge custom mappings from decoders for payloads collection
    for (const decoder of this.decoders.values()) {
      this.config.adminCollections.payloads.properties.payload.properties = {
        ...this.config.adminCollections.payloads.properties.payload.properties,
        ...decoder.payloadsMappings,
      };
    }
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
