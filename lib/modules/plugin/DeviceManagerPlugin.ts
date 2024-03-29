import _ from "lodash";
import {
  Plugin,
  PluginContext,
  PluginImplementationError,
  KuzzleRequest,
  BadRequestError,
} from "kuzzle";
import { JSONObject } from "kuzzle-sdk";
import { ConfigManager, EngineController } from "kuzzle-plugin-commons";

import {
  batteryMeasureDefinition,
  humidityMeasureDefinition,
  MeasureDefinition,
  movementMeasureDefinition,
  positionMeasureDefinition,
  temperatureMeasureDefinition,
} from "../measure";

import { DeviceModule, devicesMappings } from "../device";
import { MeasureModule } from "../measure";
import { AssetModule } from "../asset";
import {
  DecoderModule,
  NamedMeasures,
  payloadsMappings,
  DecodersRegister,
} from "../decoder";
import {
  AssetModelDefinition,
  DeviceModelDefinition,
  ModelModule,
  modelsMappings,
  ModelsRegister,
} from "../model";
import { keepStack, lock } from "../shared";

import { DeviceManagerConfiguration } from "./types/DeviceManagerConfiguration";
import { DeviceManagerEngine } from "./DeviceManagerEngine";
import { InternalCollection } from "./types/InternalCollection";

export class DeviceManagerPlugin extends Plugin {
  public config: DeviceManagerConfiguration;

  private deviceManagerEngine: DeviceManagerEngine;
  private adminConfigManager: ConfigManager;
  private engineConfigManager: ConfigManager;
  private engineController: EngineController<DeviceManagerPlugin>;

  private assetModule: AssetModule;
  private deviceModule: DeviceModule;
  private decoderModule: DecoderModule;
  private measureModule: MeasureModule;
  private modelModule: ModelModule;

  private modelsRegister: ModelsRegister;
  private decodersRegister: DecodersRegister;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  get models() {
    return {
      /**
       * Register an asset model
       *
       * @param engineGroup Engine group name
       * @param model Name of the asset model
       * @param definition.measures Array describing measures names and types
       * @param definition.metadataMappings Metadata mappings definition
       * @param definition.defaultMetadata Default metadata values
       *
       * @example
       * ```
       * deviceManager.models.registerAsset(
       *   "logistic",
       *   "Container",
       *   {
       *     measures: [
       *       { name: "temperatureExt", type: "temperature" },
       *       { name: "temperatureInt", type: "temperature" },
       *       { name: "position", type: "position" },
       *     ],
       *     metadataMappings: {
       *       weight: { type: "integer" },
       *       height: { type: "integer" },
       *     },
       *     defaultMetadata: {
       *       height: 20
       *     }
       *   }
       * );
       * ```
       */
      registerAsset: (
        engineGroup: string,
        model: string,
        definition: AssetModelDefinition
      ) => {
        this.modelsRegister.registerAsset(
          engineGroup,
          model,
          definition.measures,
          definition.metadataMappings,
          definition.defaultMetadata
        );
      },

      /**
       * Register a device model
       *
       * @param model Name of the device model
       * @param definition.decoded Decoder used to decode payloads
       * @param definition.metadataMappings Metadata mappings definition
       * @param definition.defaultMetadata Default metadata values
       *
       * @example
       * ```
       * deviceManager.models.registerDevice(
       *   "Abeeway",
       *   {
       *     decoder: new DummyTempPositionDecoder(),
       *     metadataMappings: {
       *       serial: { type: "keyword" },
       *     }
       *   }
       * );
       * ```
       */
      registerDevice: (model: string, definition: DeviceModelDefinition) => {
        this.decodersRegister.register(definition.decoder);

        this.modelsRegister.registerDevice(
          model,
          definition.decoder.measures as NamedMeasures,
          definition.metadataMappings,
          definition.defaultMetadata
        );
      },

      /**
       * Register a new measure
       *
       * @param name Name of the measure
       * @param valuesMappings Mappings for the measure values
       *
       * @example
       * ```
       * deviceManager.models.registerMeasure("acceleration", {
       *   x: { type: "float" },
       *   y: { type: "float" },
       *   z: { type: "float" },
       * });
       * ```
       */
      registerMeasure: (name: string, measureDefinition: MeasureDefinition) => {
        this.modelsRegister.registerMeasure(name, measureDefinition);
      },
    };
  }

  constructor() {
    super({
      kuzzleVersion: ">=2.20.2 <3",
    });

    /* eslint-disable sort-keys */

    this.api = {};
    this.pipes = {
      "generic:document:beforeWrite": [],
      "generic:document:beforeUpdate": [],
      "generic:document:beforeDelete": [],
    };
    this.hooks = {};
    this.imports = {
      roles: {},
      users: {},
      profiles: {},
      onExistingUsers: "skip",
    };

    this.config = {
      ignoreStartupErrors: false,
      engine: {
        autoUpdate: true,
      },
      adminIndex: "device-manager",
      adminCollections: {
        config: {
          name: "config",
          mappings: {
            dynamic: "strict",
            properties: {},
          },
          settings: {},
        },
        devices: {
          name: "devices",
          mappings: devicesMappings,
          settings: {},
        },
        payloads: {
          name: "payloads",
          mappings: payloadsMappings,
          settings: {},
        },
      },
      engineCollections: {
        config: {
          name: "config",
          mappings: {
            dynamic: "strict",
            properties: {},
          },
          settings: {},
        },
      },
    };
    /* eslint-enable sort-keys */

    // Registers
    this.decodersRegister = new DecodersRegister();
    this.modelsRegister = new ModelsRegister();

    this.models.registerMeasure("temperature", temperatureMeasureDefinition);
    this.models.registerMeasure("position", positionMeasureDefinition);
    this.models.registerMeasure("movement", movementMeasureDefinition);
    this.models.registerMeasure("humidity", humidityMeasureDefinition);
    this.models.registerMeasure("battery", batteryMeasureDefinition);
  }

  /**
   * Init the plugin
   */
  async init(config: JSONObject, context: PluginContext) {
    this.config = _.merge({}, this.config, config);
    this.context = context;

    // Modules creation
    this.assetModule = new AssetModule(this);
    this.deviceModule = new DeviceModule(this);
    this.decoderModule = new DecoderModule(this);
    this.measureModule = new MeasureModule(this);
    this.modelModule = new ModelModule(this);

    // Modules init
    await this.assetModule.init();
    await this.deviceModule.init();
    await this.decoderModule.init();
    await this.measureModule.init();
    await this.modelModule.init();

    this.decodersRegister.init(this, this.context);
    this.modelsRegister.init(this);

    this.adminConfigManager = new ConfigManager(this, {
      mappings: this.config.adminCollections.config.mappings,
      settings: this.config.adminCollections.config.settings,
    });
    this.adminConfigManager.register("device-manager", {
      properties: {
        provisioningStrategy: { type: "keyword" },
      },
    });

    this.adminConfigManager.register("engine", {
      properties: {
        group: { type: "keyword" },
        index: { type: "keyword" },
        name: { type: "keyword" },
      },
    });

    this.engineConfigManager = new ConfigManager(this, {
      mappings: this.config.engineCollections.config.mappings,
      settings: this.config.engineCollections.config.settings,
    });

    this.deviceManagerEngine = new DeviceManagerEngine(
      this,
      this.adminConfigManager,
      this.engineConfigManager
    );

    this.engineController = new EngineController(
      "device-manager",
      this,
      this.deviceManagerEngine
    );

    this.decodersRegister.registerDefaultRights();
    this.decodersRegister.printDecoders();

    try {
      await this.initDatabase();
    } catch (error) {
      if (this.config.ignoreStartupErrors) {
        this.context.log.warn(
          `WARNING: An error occured during plugin initialization: ${error.message}`
        );
      } else {
        throw error;
      }
    }

    if (this.config.ignoreStartupErrors) {
      this.context.log.warn(
        'WARNING: The "ignoreStartupErrors" option is enabled. Additional errors may appears at runtime.'
      );
    }
  }

  /**
   * Initialize the administration index of the plugin
   */
  private async initDatabase() {
    await lock("device-manager/initDatabase", async () => {
      if (!(await this.sdk.index.exists(this.config.adminIndex))) {
        // Possible race condition because of index cache propagation.
        // The index has been created but the node didn't receive the index
        // cache update message yet, causing index:exists to returns false
        try {
          await this.sdk.index.create(this.config.adminIndex);
        } catch (error) {
          if (!error.message.includes("already exists")) {
            throw error;
          }
        }
      }

      await this.adminConfigManager
        .createCollection(this.config.adminIndex)
        .catch((error) => {
          throw keepStack(
            error,
            new PluginImplementationError(
              `Cannot create admin "config" collection: ${error}`
            )
          );
        });

      await this.sdk.collection
        .create(this.config.adminIndex, InternalCollection.MODELS, {
          mappings: modelsMappings,
        })
        .catch((error) => {
          throw keepStack(
            error,
            new PluginImplementationError(
              `Cannot create admin "models" collection: ${error}`
            )
          );
        });
      await this.modelsRegister.loadModels();

      await this.deviceManagerEngine
        .createDevicesCollection(this.config.adminIndex)
        .catch((error) => {
          throw keepStack(
            error,
            new PluginImplementationError(
              `Cannot create admin "devices" collection: ${error}`
            )
          );
        });

      await this.sdk.collection
        .create(this.config.adminIndex, "payloads", this.getPayloadsMappings())
        .catch((error) => {
          throw keepStack(
            error,
            new PluginImplementationError(
              `Cannot create admin "payloads" collection: ${error}`
            )
          );
        });

      await this.initializeConfig();

      if (this.config.engine.autoUpdate) {
        await this.deviceManagerEngine.updateEngines();
      }
    });
  }

  /**
   * Merge custom mappings defined in the Decoder into the "payloads" collection
   * mappings.
   *
   * Those custom mappings allow to search raw payloads more efficiently.
   */
  private getPayloadsMappings(): JSONObject {
    const { mappings } = JSON.parse(
      JSON.stringify(this.config.adminCollections.payloads)
    );

    for (const decoder of this.decodersRegister.decoders) {
      mappings.properties.payload.properties = {
        ...mappings.properties.payload.properties,
        ...decoder.payloadsMappings,
      };
    }

    return mappings;
  }

  /**
   * Initialize the config document if it does not exists
   */
  private async initializeConfig() {
    const exists = await this.sdk.document.exists(
      this.config.adminIndex,
      this.adminConfigManager.collection,
      "plugin--device-manager"
    );

    if (!exists) {
      await this.sdk.document.create(
        this.config.adminIndex,
        this.adminConfigManager.collection,
        {
          "device-manager": { provisioningStrategy: "auto" },
          type: "device-manager",
        },
        "plugin--device-manager"
      );
    }
  }

  private async pipeCheckEngine(request: KuzzleRequest) {
    const engineId = request.getString("engineId");

    if (engineId !== this.config.adminIndex) {
      const {
        result: { exists },
      } = await this.sdk.query({
        action: "exists",
        controller: "device-manager/engine",
        index: engineId,
      });

      if (!exists) {
        throw new BadRequestError(
          `Tenant "${engineId}" does not have a device-manager engine`
        );
      }
    }

    return request;
  }
}
