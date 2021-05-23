import {
  Plugin,
  PluginContext,
  JSONObject,
  EmbeddedSDK,
  PluginImplementationError,
  Mutex,
  KuzzleRequest,
  BadRequestError,
  Inflector,
} from 'kuzzle';

import {
  AssetController,
  DeviceController,
  EngineController,
} from './controllers';

import { EngineService, PayloadService, DeviceService } from './services';
import { Decoder } from './decoders';
import {
  assetsMappings,
  devicesMappings,
  AssetsCustomProperties,
  DevicesCustomProperties
} from './models';
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
   * List of registered decoders.
   * Map<model, decoder>
   */
  private decoders = new Map<string, Decoder>();

  public devices = new DevicesCustomProperties(devicesMappings);

  public assets = new AssetsCustomProperties(assetsMappings);

  /**
   * Constructor
   */
  constructor() {
    super({
      kuzzleVersion: '>=2.11.1 <3'
    });

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
        devices: devicesMappings
      }
    };
  }

  /**
   * Init the plugin
   */
  async init (config: JSONObject, context: PluginContext) {
    this.config = { ...this.defaultConfig, ...config };

    this.context = context;

    this.config.mappings = new Map<string, JSONObject>();

    this.mergeMappings();

    this.engineService = new EngineService(this.config, context);
    this.payloadService = new PayloadService(this.config, context);
    this.deviceService = new DeviceService(this.config, context, this.decoders);
    this.assetController = new AssetController(this.config, context);
    this.engineController = new EngineController(this.config, context, this.engineService);
    this.deviceController = new DeviceController(this.config, context, this.deviceService);

    this.api['device-manager/asset'] = this.assetController.definition;
    this.api['device-manager/device'] = this.deviceController.definition;
    this.api['device-manager/engine'] = this.engineController.definition;

    this.pipes = {
      'device-manager/device:beforeUpdate': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeSearch': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeAttachTenant': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeDetach': this.pipeCheckEngine.bind(this),
      'device-manager/asset:before*': this.pipeCheckEngine.bind(this),
    };

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
    decoder.action = decoder.action || Inflector.kebabCase(decoder.deviceModel);

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

  /**
   * Merge custom properties mappings for 'assets' and 'devices' collection by tenant group
   */
  private mergeMappings() {
    const assetsProperties = this.assets.definitions.get('shared');
    const devicesProperties = this.devices.definitions.get('shared');

    // Retrieve each group name which has custom properties definition
    const tenantGroups = [...new Set(Array.from(this.devices.definitions.keys())
      .concat(Array.from(this.assets.definitions.keys())))];

    // Init each group with 'devices' and 'assets' shared properties definition
    for (const tenantGroup of tenantGroups) {
      this.config.mappings.set(tenantGroup, {
        assets: {
          dynamic: 'false',
          properties: assetsProperties
        },
        devices: {
          dynamic: 'false',
          properties: devicesProperties
        }
      });
    }

    // Merge custom 'devices' properties with shared properties
    for (const [tenantGroup, customProperties] of this.devices.definitions) {
      this.config.mappings.set(tenantGroup, {
        assets: this.config.mappings.get(tenantGroup).assets,
        devices: {
          dynamic: 'false',
          properties: {
            ...devicesProperties,
            ...customProperties,
          }
        }
      });
    }

    // Merge custom 'assets' properties with shared properties
    for (const [tenantGroup, customProperties] of this.assets.definitions) {
      this.config.mappings.set(tenantGroup, {
        assets: {
          dynamic: 'false',
          properties: {
            ...assetsProperties,
            ...customProperties
          }
        },
        devices: this.config.mappings.get(tenantGroup).devices,
      });

      // Use "devices" mappings to generate "assets" collection mappings
      // for the "measures" property
      const deviceProperties = {
        id: { type: 'keyword' },
        reference: { type: 'keyword' },
        model: { type: 'keyword' },
      };

      const tenantMappings = this.config.mappings.get(tenantGroup);

      for (const [measureType, definition] of Object.entries(tenantMappings.devices.properties.measures.properties) as any) {
        tenantMappings.assets.properties.measures.properties[measureType] = {
          dynamic: 'false',
          properties: {
            ...deviceProperties,
            ...definition.properties,
            qos: {
              properties: tenantMappings.devices.properties.qos.properties
            }
          }
        };
      }
      this.config.mappings.set(tenantGroup, tenantMappings);
    }

    // Merge custom mappings from decoders for payloads collection
    for (const decoder of this.decoders.values()) {
      this.config.adminCollections.payloads.properties.payload.properties = {
        ...this.config.adminCollections.payloads.properties.payload.properties,
        ...decoder.payloadsMappings,
      };
    }

    // Copy common mappings into the config
    this.config.collections = this.config.mappings.get('shared');
    this.config.adminCollections.devices = this.config.mappings.get('shared').devices;
  }

  private async pipeCheckEngine (request: KuzzleRequest) {
    const index = request.getIndex();

    const { result: { exists } } = await this.sdk.query({
      controller: 'device-manager/engine',
      action: 'exists',
      index,
    });

    if (! exists) {
      throw new BadRequestError(`Tenant "${index}" does not have a device-manager engine`);
    }

    return request;
  }
}
