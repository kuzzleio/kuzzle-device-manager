import _ from 'lodash';
import {
  Plugin,
  PluginContext,
  JSONObject,
  PluginImplementationError,
  Mutex,
  KuzzleRequest,
  BadRequestError,
} from 'kuzzle';
import { ConfigManager, EngineController } from 'kuzzle-plugin-commons';

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
  AssetsRegister,
  DevicesRegister,
  AssetService,
  MeasuresRegister,
  DecodersRegister,
} from './core-classes';
import {
} from './models';
import {
  batteryMeasure,
  humidityMeasure,
  movementMeasure,
  positionMeasure,
  temperatureMeasure,
} from './measures';
import {
  payloadsMappings,
  devicesMappings,
  catalogMappings,
} from './mappings';
import { DeviceManagerConfiguration } from './types';

export class DeviceManagerPlugin extends Plugin {
  public config: DeviceManagerConfiguration;

  private assetController: AssetController;
  private deviceController: DeviceController;
  private decodersController: DecodersController;
  private engineController: EngineController<DeviceManagerPlugin>;

  private assetService: AssetService;
  private payloadService: PayloadService;
  private deviceManagerEngine: DeviceManagerEngine;
  private deviceService: DeviceService;

  private batchWriter: BatchWriter;

  private decodersRegister = new DecodersRegister();
  private measuresRegister = new MeasuresRegister();
  private devicesRegister = new DevicesRegister(this.measuresRegister);
  private assetsRegister = new AssetsRegister(this.measuresRegister);

  private adminConfigManager: ConfigManager;
  private engineConfigManager: ConfigManager;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  /**
   * Manager assets customization.
   *
   * @method register
   */
  get assets () {
    return this.assetsRegister;
  }

  /**
   * Manage devices customization.
   *
   * @method registerMetadata
   */
  get devices () {
    return this.devicesRegister;
  }

  /**
   * Manage measures customization.
   *
   * @method register
   * @method get
   */
  get measures () {
    return this.measuresRegister;
  }

  /**
   * Manage decoders customization.
   *
   * @method register
   * @method list
   */
  get decoders () {
    return this.decodersRegister;
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

    // eslint-disable sort-keys
    this.config = {
      adminIndex: 'device-manager',
      adminCollections: {
        config: {
          name: 'config',
          mappings: {
            dynamic: 'strict',
            properties: {}
          },
          settings: {},
        },
        devices: {
          name: 'devices',
          mappings: devicesMappings,
          settings: {},
        },
        payloads: {
          name: 'payloads',
          mappings: payloadsMappings,
          settings: {},
        }
      },
      writerInterval: 10
    };
    // eslint-enable sort-keys
  }

  /**
   * Init the plugin
   */
  async init (config: JSONObject, context: PluginContext) {
    this.config = _.merge({}, this.config, config);

    this.context = context;

    this.pipes = {
      'device-manager/asset:before*': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeAttachTenant': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeSearch': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeUpdate': this.pipeCheckEngine.bind(this),
      'generic:document:beforeWrite': [],
    };

    this.adminConfigManager = new ConfigManager(this, {
      mappings: this.config.adminCollections.config.mappings,
      settings: this.config.adminCollections.config.settings,
    });
    this.adminConfigManager.register('catalog', catalogMappings);
    this.adminConfigManager.register('device-manager', {
      properties: {
        provisioningStrategy: { type: 'keyword' },
      }
    });
    this.adminConfigManager.register('engine', {
      properties: {
        index: { type: 'keyword' },
        group: { type: 'keyword' },
        name: { type: 'keyword' },
      }
    });

    this.measures.register('temperature', temperatureMeasure);
    this.measures.register('position', positionMeasure);
    this.measures.register('movement', movementMeasure);
    this.measures.register('humidity', humidityMeasure);
    this.measures.register('battery', batteryMeasure);

    this.batchWriter = new BatchWriter(this.sdk, { interval: this.config.writerInterval });
    this.batchWriter.begin();

    this.assetService = new AssetService(this);
    this.payloadService = new PayloadService(this, this.batchWriter, this.measuresRegister);
    this.deviceService = new DeviceService(this);
    this.deviceManagerEngine = new DeviceManagerEngine(
      this,
      this.assetsRegister,
      this.devicesRegister,
      this.measuresRegister,
      this.adminConfigManager,
      this.engineConfigManager);

    this.assetController = new AssetController(this, this.assetService);
    this.deviceController = new DeviceController(this, this.deviceService);
    this.decodersController = new DecodersController(this, this.decodersRegister);
    this.engineController = new EngineController('device-manager', this, this.deviceManagerEngine);

    this.api['device-manager/payload'] = this.decodersRegister.getPayloadController(this.payloadService);
    this.api['device-manager/asset'] = this.assetController.definition;
    this.api['device-manager/device'] = this.deviceController.definition;
    this.api['device-manager/decoders'] = this.decodersController.definition;

    for (const decoder of this.decodersRegister.decoders) {
      this.context.log.info(`Decoder for "${decoder.deviceModel}" registered`);
    }

    await this.initDatabase();
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
          if (! error.message.includes('already exists')) {
            throw error;
          }
        }
      }

      await Promise.all([
        this.adminConfigManager.createCollection(this.config.adminIndex)
          .catch(error => {
            throw new PluginImplementationError(`Cannot create admin "config" collection: ${error}`);
          }),
        this.sdk.collection.create(this.config.adminIndex, 'devices', this.devicesRegister.getMappings())
          .catch(error => {
            throw new PluginImplementationError(`Cannot create admin "devices" collection: ${error}`);
          }),
        this.sdk.collection.create(this.config.adminIndex, 'payloads', this.getPayloadsMappings())
          .catch(error => {
            throw new PluginImplementationError(`Cannot create admin "payloads" collection: ${error}`);
          }),
      ]);

      await this.initializeConfig();
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
    const { mappings } = JSON.parse(JSON.stringify(this.config.adminCollections.payloads));

    for (const decoder of this.decodersRegister.decoders) {
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
      this.adminConfigManager.collection,
      'plugin--device-manager');

    if (! exists) {
      await this.sdk.document.create(
        this.config.adminIndex,
        this.adminConfigManager.collection,
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
}
