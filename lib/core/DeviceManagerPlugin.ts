import _ from "lodash";
import {
  Plugin,
  PluginContext,
  JSONObject,
  PluginImplementationError,
  KuzzleRequest,
  BadRequestError,
} from "kuzzle";
import { ConfigManager, EngineController } from "kuzzle-plugin-commons";

import {
  batteryMeasure,
  humidityMeasure,
  MeasureUnit,
  movementMeasure,
  positionMeasure,
  temperatureMeasure,
} from "../modules/measure";

import { DeviceModule, devicesMappings } from "../modules/device";
import { MeasureModule } from "../modules/measure";
import { AssetModule } from "../modules/asset";
import { Decoder, DecoderModule, payloadsMappings } from "../modules/decoder";
import { ModelModule, modelsMappings } from "../modules/model";
import { lock } from "../modules/shared/utils/lock";

import { DeviceManagerConfiguration } from "./DeviceManagerConfiguration";
import { DeviceManagerEngine } from "./DeviceManagerEngine";
import { DecodersRegister } from "./registers/DecodersRegister";
import { InternalCollection } from "./InternalCollection";
import { ModelsRegister } from "./registers/ModelsRegister";

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
      registerAsset: (
        model: string,
        metadataMappings: JSONObject,
        { engineGroup }: { engineGroup: string }
      ) => {
        return this.modelsRegister.registerAsset(model, metadataMappings, {
          engineGroup,
        });
      },

      registerDevice: (model: string, metadataMappings: JSONObject) => {
        return this.modelsRegister.registerDevice(model, metadataMappings);
      },

      registerMeasure: (
        name: string,
        {
          unit,
          valuesMappings,
        }: {
          unit: MeasureUnit;
          valuesMappings: JSONObject;
        }
      ) => {
        return this.modelsRegister.registerMeasure(name, unit, valuesMappings);
      },
    };
  }

  registerDecoder(decoder: Decoder) {
    return this.decodersRegister.register(decoder);
  }

  constructor() {
    super({
      kuzzleVersion: ">=2.19.5 <3",
    });

    /* eslint-disable sort-keys */

    this.api = {};
    this.pipes = {
      "generic:document:beforeWrite": [],
      "generic:document:beforeUpdate": [],
      "generic:document:beforeDelete": [],
    };
    this.hooks = {};

    this.config = {
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

    this.models.registerMeasure("temperature", temperatureMeasure);
    this.models.registerMeasure("position", positionMeasure);
    this.models.registerMeasure("movement", movementMeasure);
    this.models.registerMeasure("humidity", humidityMeasure);
    this.models.registerMeasure("battery", batteryMeasure);
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

    this.decodersRegister.init(this.context);
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

    this.hooks["kuzzle:state:live"] = async () => {
      await this.decodersRegister.createDefaultRights();
      this.context.log.info(
        "Default rights for payload controller has been registered."
      );
    };

    this.decodersRegister.printDecoders();

    await this.initDatabase();
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
          throw new PluginImplementationError(
            `Cannot create admin "config" collection: ${error}`
          );
        });

      await this.sdk.collection
        .create(this.config.adminIndex, InternalCollection.MODELS, {
          mappings: modelsMappings,
        })
        .catch((error) => {
          throw new PluginImplementationError(
            `Cannot create admin "models" collection: ${error}`
          );
        });
      await this.modelsRegister.loadModels();

      await this.deviceManagerEngine
        .createDevicesCollection(this.config.adminIndex)
        .catch((error) => {
          throw new PluginImplementationError(
            `Cannot create admin "devices" collection: ${error}`
          );
        });

      await this.sdk.collection
        .create(this.config.adminIndex, "payloads", this.getPayloadsMappings())
        .catch((error) => {
          throw new PluginImplementationError(
            `Cannot create admin "payloads" collection: ${error}`
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
