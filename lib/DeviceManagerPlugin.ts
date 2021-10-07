import _ from 'lodash';
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
import { EngineController } from 'kuzzle-plugin-commons';

import {
  AssetController,
  DeviceController,
} from './controllers';
import {
  DeviceManagerEngine,
  PayloadService,
  DeviceService,
  MigrationService,
  BatchWriter,
  Decoder,
  PayloadHandler,
  AssetMappingsManager,
  DeviceMappingsManager,
} from './core-classes';
import {
  assetsMappings,
  devicesMappings,
  catalogMappings,
  assetsHistoryMappings,
} from './models';

export type DeviceManagerConfig = {
  /**
   * Administration index name
   */
  adminIndex: string;

  /**
   * Config collection name (in admin index)
   */
  configCollection: string;

  /**
   * Administration collections mappings (in admin index)
   */
  adminCollections: {
    config: JSONObject;

    devices: JSONObject;

    payloads: JSONObject;
  },

  /**
   * Tenants collections
   */
  collections: {
    assets: JSONObject;

    devices: JSONObject;

    'asset-history': JSONObject;
  },

  /**
   * Interval to write documents from the buffer
   */
  writerInterval: number;
}

export class DeviceManagerPlugin extends Plugin {
  public config: DeviceManagerConfig;

  private defaultConfig: DeviceManagerConfig;

  private assetController: AssetController;
  private deviceController: DeviceController;
  private engineController: EngineController;

  private payloadService: PayloadService;
  private deviceManagerEngine: DeviceManagerEngine;
  private deviceService: DeviceService;
  private migrationService: MigrationService;

  private batchWriter: BatchWriter;

  private get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  /**
   * List of registered decoders.
   * Map<model, decoder>
   */
  private decoders = new Map<string, Decoder>();

  private deviceMappings = new DeviceMappingsManager(devicesMappings);

  private assetMappings = new AssetMappingsManager(assetsMappings, this.deviceMappings);

  get assets () {
    return this.assetMappings;
  }

  get devices () {
    return this.deviceMappings;
  }

  /**
   * Constructor
   */
  constructor() {
    super({
      kuzzleVersion: '>=2.14.0 <3'
    });

    this.api = {
      'device-manager/payload': {
        actions: {}
      }
    };

    this.defaultConfig = {
      adminIndex: 'device-manager',
      configCollection: 'config',
      adminCollections: {
        config: {
          dynamic: 'strict',
          properties: {
            type: { type: 'keyword' },

            engine: {
              properties: {
                index: { type: 'keyword' },
                group: { type: 'keyword' },
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
          dynamic: 'strict',
          properties: {
            uuid: { type: 'keyword' },
            valid: { type: 'boolean' },
            deviceModel: { type: 'keyword' },
            payload: {
              dynamic: 'false',
              properties: {}
            }
          }
        }
      },
      collections: {
        assets: assetsMappings,
        devices: devicesMappings,
        'asset-history': assetsHistoryMappings,
      },
      writerInterval: 50
    };
  }

  /**
   * Init the plugin
   */
  async init (config: JSONObject, context: PluginContext) {
    this.config = _.merge({}, this.defaultConfig, config);

    this.context = context;

    this.batchWriter = new BatchWriter(this.sdk, { interval: this.config.writerInterval });
    this.batchWriter.begin();

    this.payloadService = new PayloadService(this, this.batchWriter);
    this.deviceService = new DeviceService(this, this.decoders);
    this.migrationService = new MigrationService('device-manager', this);
    this.deviceManagerEngine = new DeviceManagerEngine(this, this.assetMappings, this.deviceMappings);

    this.assetController = new AssetController(this);
    this.deviceController = new DeviceController(this, this.deviceService);
    this.engineController = new EngineController('device-manager', this, this.deviceManagerEngine);

    this.api['device-manager/asset'] = this.assetController.definition;
    this.api['device-manager/device'] = this.deviceController.definition;

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
   * If a custom payload handler is given then it will be used to process payloads
   * instead of the PayloadService.process method.
   *
   * @param decoder Instantiated decoder
   * @param options.handler Custom payload handler
   *
   * @returns Corresponding API action requestPayload
   */
  registerDecoder (
    decoder: Decoder,
    { handler }: { handler?: PayloadHandler } = {}
  ): { controller: string, action: string } {
    decoder.action = decoder.action || Inflector.kebabCase(decoder.deviceModel);

    if (this.api['device-manager/payload'].actions[decoder.action]) {
      throw new PluginImplementationError(`A decoder for "${decoder.deviceModel}" has already been registered.`);
    }

    this.api['device-manager/payload'].actions[decoder.action] = {
      handler: request => handler ? handler(request, decoder) : this.payloadService.process(request, decoder),
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
        // Possible race condition because of index cache propagation.
        // The index has been created but the node didn't receive the index
        // cache update message yet, causing index:exists to returns false
        try {
          await this.sdk.index.create(this.config.adminIndex);
        }
        catch (error) {
          if (error.id !== 'services.storage.index_already_exists') {
            throw error;
          }
        }
      }

      await Promise.all([
        this.sdk.collection.create(this.config.adminIndex, this.config.configCollection, this.config.adminCollections.config),
        this.sdk.collection.create(this.config.adminIndex, 'devices', this.deviceMappings.get()),
        this.sdk.collection.create(this.config.adminIndex, 'payloads', this.getPayloadsMappings()),
      ]);

      await this.initializeConfig();
    }
    catch (error) {
      // When nodes are starting at the same time, the index cache synchronization
      // message is received too late so index.exists returns false
      if (error.id !== 'services.storage.index_already_exists') {
        throw error;
      }
    }
    finally {
      await mutex.unlock();
    }
  }

  /**
   * Merge custom mappings defined in the Decoder into the "payloads" collection
   * mappings.
   *
   * Those custom mappings allow to search raw payloads more efficiently.
   */
  private getPayloadsMappings (): JSONObject {
    const mappings = JSON.parse(JSON.stringify(this.config.adminCollections.payloads));

    for (const decoder of this.decoders.values()) {
      mappings.properties.payload.properties = {
        ...mappings.properties.payload.properties,
        ...decoder.payloadsMappings
      };
    }

    return mappings;
  }

  /**
   * Initialize the config document if it does not exists
   */
  private async initializeConfig () {
    const exists = await this.sdk.document.exists(
      this.config.adminIndex,
      this.config.configCollection,
      'plugin--device-manager');

    if (! exists) {
      await this.sdk.document.create(
        this.config.adminIndex,
        this.config.configCollection,
        {
          type: 'device-manager',
          'device-manager': { autoProvisionning: true }
        },
        'plugin--device-manager');
    }
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
    if (request.getCollection() !== this.config.configCollection) {
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
