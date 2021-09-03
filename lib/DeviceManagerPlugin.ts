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

import {
  EngineService,
  PayloadService,
  DeviceService,
  AssetsCustomProperties,
  DevicesCustomProperties,
  MigrationService,
} from './services';
import { Decoder } from './decoders';
import {
  assetsMappings,
  devicesMappings,
  catalogMappings,
} from './models';
import { BatchProcessor, BatchDocumentController } from './services/BatchProcessor';

export class DeviceManagerPlugin extends Plugin {
  private defaultConfig: JSONObject;

  private assetController: AssetController;
  private deviceController: DeviceController;
  private engineController: EngineController;

  private payloadService: PayloadService;
  private engineService: EngineService;
  private deviceService: DeviceService;
  private migrationService: MigrationService;

  private batchProcessor: BatchProcessor;
  private batchController: BatchDocumentController;

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
        config: {
          dynamic: 'strict',
          properties: {
            type: { type: 'keyword' },

            engine: {
              properties: {
                index: { type: 'keyword' },
              }
            },

            catalog: catalogMappings,

            'device-manager': {
              properties: {
                autoProvisionning: { type: 'boolean' },
              }
            }
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
        devices: devicesMappings,
      },
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

    this.batchProcessor = new BatchProcessor(this.sdk, 50);
    this.batchController = new BatchDocumentController(this.sdk, this.batchProcessor);
    this.batchProcessor.begin();

    this.engineService = new EngineService(this.config, context);
    this.payloadService = new PayloadService(this.config, context, this.batchController);
    this.deviceService = new DeviceService(this.config, context, this.decoders);
    this.migrationService = new MigrationService(this.config, context);

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
      'device-manager/asset:before*': this.pipeCheckEngine.bind(this),
      'document:beforeCreate': this.generateConfigID.bind(this),
    };

    await this.initDatabase();

    await this.migrationService.run();

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

      await Promise.all(Object.entries(this.config.adminCollections)
        .map(([collection, mappings]) => (
          this.sdk.collection.create(this.config.adminIndex, collection, { mappings })
        ))
      );

      await this.initializeConfig();
    }
    finally {
      await mutex.unlock();
    }
  }

  /**
   * Initialize the config document if it does not exists
   */
  private async initializeConfig () {
    const exists = await this.sdk.document.exists(
      this.config.adminIndex,
      'config',
      'plugin--device-manager');

    if (! exists) {
      await this.sdk.document.create(
        this.config.adminIndex,
        'config',
        {
          type: 'device-manager',
          'device-manager': { autoProvisionning: true }
        },
        'plugin--device-manager');
    }
  }

  /**
   * Merge custom properties mappings for 'assets' and 'devices' collection by tenant group
   */
  private mergeMappings() {
    const assetsProperties = this.assets.definitions.get('commons');
    const devicesProperties = this.devices.definitions.get('commons');

    // Retrieve each group name which has custom properties definition
    const groups = [...new Set(Array.from(this.devices.definitions.keys())
      .concat(Array.from(this.assets.definitions.keys())))];

    // Init each group with 'devices' and 'assets' commons properties definition
    for (const group of groups) {
      this.config.mappings.set(group, {
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

    // Merge custom 'devices' properties with commons properties
    for (const [group, customProperties] of this.devices.definitions) {
      this.config.mappings.set(group, {
        assets: this.config.mappings.get(group).assets,
        devices: {
          dynamic: 'false',
          properties: {
            ...devicesProperties,
            ...customProperties,
          }
        }
      });
    }

    // Merge custom 'assets' properties with commons properties
    for (const [group, customProperties] of this.assets.definitions) {
      this.config.mappings.set(group, {
        assets: {
          dynamic: 'false',
          properties: {
            ...assetsProperties,
            ...customProperties
          }
        },
        devices: this.config.mappings.get(group).devices,
      });

      // Use "devices" mappings to generate "assets" collection mappings
      // for the "measures" property
      const deviceProperties = {
        id: { type: 'keyword' },
        reference: { type: 'keyword' },
        model: { type: 'keyword' },
      };

      const tenantMappings = this.config.mappings.get(group);

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
      this.config.mappings.set(group, tenantMappings);
    }

    // Merge custom mappings from decoders for payloads collection
    for (const decoder of this.decoders.values()) {
      this.config.adminCollections.payloads.properties.payload.properties = {
        ...this.config.adminCollections.payloads.properties.payload.properties,
        ...decoder.payloadsMappings,
      };
    }

    // Copy common mappings into the config
    this.config.collections = this.config.mappings.get('commons');
    this.config.adminCollections.devices = this.config.mappings.get('commons').devices;
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

  private async generateConfigID (request: KuzzleRequest) {
    if (request.getCollection() !== 'config') {
      return request;
    }

    const document = request.getBody();

    if (document.type !== 'catalog' || request.getId(({ ifMissing: 'ignore' }))) {
      return request;
    }

    request.input.args._id = `catalog--${document.catalog.deviceId}`;

    return request;
  }
}
