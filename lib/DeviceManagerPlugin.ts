import _ from 'lodash';
import {
  Plugin,
  PluginContext,
  JSONObject,
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
  DecodersController
} from './controllers';
import {
  DeviceManagerEngine,
  PayloadService,
  DeviceService,
  BatchWriter,
  Decoder,
  PayloadHandler,
  AssetsRegister,
  DevicesRegister,
  DecodersService,
  AssetService,
  MeasuresRegister,
} from './core-classes';
import {
  devicesMappings,
  catalogMappings,
} from './models';
import {
  humidityMeasure,
  movementMeasure,
  positionMeasure,
  temperatureMeasure,
} from './measures';

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
   * Interval to write documents from the buffer
   */
  writerInterval: number;
}

export class DeviceManagerPlugin extends Plugin {
  public config: DeviceManagerConfig;

  private defaultConfig: DeviceManagerConfig;

  private assetController: AssetController;
  private deviceController: DeviceController;
  private decodersController: DecodersController;
  private engineController: EngineController<DeviceManagerPlugin>;

  private assetService: AssetService;
  private payloadService: PayloadService;
  private deviceManagerEngine: DeviceManagerEngine;
  private deviceService: DeviceService;
  private decodersService: DecodersService;

  private batchWriter: BatchWriter;

  private decoders: Array<{ decoder: Decoder, handler: PayloadHandler }> = [];

  private measuresRegister = new MeasuresRegister();
  private devicesRegister = new DevicesRegister(this.measuresRegister);
  private assetsRegister = new AssetsRegister(this.measuresRegister);

  private get sdk () {
    return this.context.accessors.sdk;
  }

  get assets () {
    return this.assetsRegister;
  }

  get devices () {
    return this.devicesRegister;
  }

  get measures () {
    return this.measuresRegister;
  }

  constructor() {
    super({
      kuzzleVersion: '>=2.16.8 <3'
    });

    this.api = {
      'device-manager/payload': {
        actions: {}
      }
    };

    this.defaultConfig = {
      adminCollections: {
        config: {
          dynamic: 'strict',
          properties: {
            catalog: catalogMappings,

            'device-manager': {
              properties: {
                provisioningStrategy: { type: 'keyword' },
              }
            },

            engine: {
              properties: {
                group: { type: 'keyword' },
                index: { type: 'keyword' },
              }
            },

            type: { type: 'keyword' }
          }
        },
        devices: devicesMappings,
        payloads: {
          dynamic: 'strict',
          properties: {
            deviceModel: { type: 'keyword' },
            payload: {
              dynamic: 'false',
              properties: {}
            },
            uuid: { type: 'keyword' },
            valid: { type: 'boolean' }
          }
        }
      },
      adminIndex: 'device-manager',
      configCollection: 'config',
      writerInterval: 50
    };
  }

  /**
   * Init the plugin
   */
  async init (config: JSONObject, context: PluginContext) {
    this.config = _.merge({}, this.defaultConfig, config);

    this.context = context;

    this.measures.register('temperature', temperatureMeasure);
    this.measures.register('position', positionMeasure);
    this.measures.register('movement', movementMeasure);
    this.measures.register('humidity', humidityMeasure);

    this.batchWriter = new BatchWriter(this.sdk, { interval: this.config.writerInterval });
    this.batchWriter.begin();

    this.assetService = new AssetService(this);
    this.payloadService = new PayloadService(this, this.batchWriter, this.measuresRegister);
    this.decodersService = new DecodersService(this, this.decoders);
    this.deviceService = new DeviceService(this);
    this.deviceManagerEngine = new DeviceManagerEngine(this, this.assetsRegister, this.devicesRegister, this.measuresRegister);

    this.assetController = new AssetController(this, this.assetService);
    this.deviceController = new DeviceController(this, this.deviceService);
    this.decodersController = new DecodersController(this, this.decodersService);
    this.engineController = new EngineController('device-manager', this, this.deviceManagerEngine);

    this.api['device-manager/payload'] = this.decodersService.buildPayloadController(this.payloadService);
    this.api['device-manager/asset'] = this.assetController.definition;
    this.api['device-manager/device'] = this.deviceController.definition;
    this.api['device-manager/decoders'] = this.decodersController.definition;

    this.pipes = {
      'device-manager/asset:before*': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeAttachTenant': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeSearch': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeUpdate': this.pipeCheckEngine.bind(this),
      'document:beforeCreate': this.generateConfigID.bind(this),
    };

    await this.initDatabase();
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

    this.decoders.push({ decoder, handler });

    return {
      action: decoder.action,
      controller: 'device-manager/payload',
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
        this.sdk.collection.create(this.config.adminIndex, 'devices', this.devicesRegister.getMappings()),
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

    for (const decoder of this.decodersService.decoders.values()) {
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
          'device-manager': { provisioningStrategy: 'auto' },
          type: 'device-manager'
        },
        'plugin--device-manager');
    }
  }

  private async pipeCheckEngine (request: KuzzleRequest) {
    const index = request.getIndex();

    if (index !== this.config.adminIndex) {
      const { result: { exists } } = await this.sdk.query({
        action: 'exists',
        controller: 'device-manager/engine',
        index,
      });

      if (! exists) {
        throw new BadRequestError(`Tenant "${index}" does not have a device-manager engine`);
      }
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
