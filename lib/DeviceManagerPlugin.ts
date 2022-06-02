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
} from './mappings';
import { DeviceManagerConfiguration } from './types';
import { AssetCategoryController } from './controllers/AssetCategoryController';
import { MetadataController } from './controllers/MetadataController';
import { AssetCategoryService } from './core-classes/AssetCategoryService';

export class DeviceManagerPlugin extends Plugin {
  public config: DeviceManagerConfiguration;

  private assetController: AssetController;
  private deviceController: DeviceController;
  private decodersController: DecodersController;
  private engineController: EngineController<DeviceManagerPlugin>;
  private assetCategoryController : AssetCategoryController;
  private metadataController: MetadataController;

  private assetService: AssetService;
  private assetCategoryService: AssetCategoryService;
  private payloadService: PayloadService;
  private deviceManagerEngine: DeviceManagerEngine;
  private deviceService: DeviceService;

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

  constructor () {
    super({
      kuzzleVersion: '>=2.16.8 <3'
    });

    this.api = {
      'device-manager/payload': {
        actions: {}
      }
    };

    /* eslint-disable sort-keys */
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
      engineCollections: {
        config: {
          name: 'config',
          mappings: {
            dynamic: 'strict',
            properties: {}
          },
          settings: {}
        }
      },
      batchInterval: 10
    };
    /* eslint-enable sort-keys */
  }

  /**
   * Init the plugin
   */
  async init (config: JSONObject, context: PluginContext) {
    this.config = _.merge({}, this.config, config);

    this.context = context;

    /* eslint-disable sort-keys */
    this.pipes = {
      'device-manager/asset:before*': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeAttachEngine': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeSearch': this.pipeCheckEngine.bind(this),
      'device-manager/device:beforeUpdate': this.pipeCheckEngine.bind(this),
      'generic:document:beforeWrite': [],
    };
    /* eslint-enable sort-keys */

    this.adminConfigManager = new ConfigManager(this, {
      mappings: this.config.adminCollections.config.mappings,
      settings: this.config.adminCollections.config.settings,
    });
    this.adminConfigManager.register('device-manager', {
      properties: {
        provisioningStrategy: { type: 'keyword' },
      }
    });
    this.adminConfigManager.register('engine', {
      properties: {
        group: { type: 'keyword' },
        index: { type: 'keyword' },
        name: { type: 'keyword' },
      }
    });

    this.engineConfigManager = new ConfigManager(this, {
      mappings: this.config.engineCollections.config.mappings,
      settings: this.config.engineCollections.config.settings,
    });

    this.measures.register('temperature', temperatureMeasure);
    this.measures.register('position', positionMeasure);
    this.measures.register('movement', movementMeasure);
    this.measures.register('humidity', humidityMeasure);
    this.measures.register('battery', batteryMeasure);

    this.assetService = new AssetService(this);
    this.assetCategoryService = new AssetCategoryService(this);
    this.payloadService = new PayloadService(this, this.measuresRegister);
    this.deviceService = new DeviceService(this);
    this.deviceManagerEngine = new DeviceManagerEngine(
      this,
      this.assetsRegister,
      this.devicesRegister,
      this.measuresRegister,
      this.adminConfigManager,
      this.engineConfigManager);

    this.decodersRegister.init(this.context);

    this.assetController = new AssetController(this, this.assetService, this.deviceService, this.assetCategoryService);
    this.deviceController = new DeviceController(this, this.deviceService);
    this.decodersController = new DecodersController(this, this.decodersRegister);
    this.engineController = new EngineController('device-manager', this, this.deviceManagerEngine);
    this.assetCategoryController = new AssetCategoryController(this);
    this.metadataController = new MetadataController(this);

    this.api['device-manager/payload'] = this.decodersRegister.getPayloadController(this.payloadService);
    this.api['device-manager/asset'] = this.assetController.definition;
    this.api['device-manager/device'] = this.deviceController.definition;
    this.api['device-manager/decoders'] = this.decodersController.definition;
    this.api['device-manager/assetCategory'] = this.assetCategoryController.definition;
    this.api['device-manager/metadata'] = this.metadataController.definition;


    this.hooks = {
      'kuzzle:state:live': async () => {
        await this.decodersRegister.createDefaultRights();
        this.context.log.info('Default rights for payload controller has been registered.');
      }
    };

    this.decodersRegister.printDecoders();

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
    const engineId = request.getString('engineId');

    if (engineId !== this.config.adminIndex) {
      const { result: { exists } } = await this.sdk.query({
        action: 'exists',
        controller: 'device-manager/engine',
        index: engineId,
      });

      if (! exists) {
        throw new BadRequestError(`Tenant "${engineId}" does not have a device-manager engine`);
      }
    }

    return request;
  }
}
