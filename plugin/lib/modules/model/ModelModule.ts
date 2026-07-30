import { DeviceManagerPlugin } from "../plugin";
import { Module } from "../shared/Module";

import { ModelsController } from "./ModelsController";
import { ModelService } from "./ModelService";
import { RoleMeasureAdaptersAdmin } from "./roles/RoleMeasureAdaptersAdmin";
import { RoleMeasureAdaptersReader } from "./roles/RoleMeasureAdaptersReader";
import { KuzzleLogger } from "kuzzle-logger";
export class ModelModule extends Module {
  private modelService: ModelService;
  private modelController: ModelsController;
  readonly logger: KuzzleLogger;
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
    this.logger = this.plugin.context.logger.child("models-module");
  }

  // @todo temporary until registers refactor
  private get decodersRegister() {
    // eslint-disable-next-line dot-notation
    return this.plugin["decodersRegister"];
  }

  public async init(): Promise<void> {
    this.modelService = new ModelService(
      this.plugin,
      this.decodersRegister,
      this.logger,
    );
    this.modelController = new ModelsController(this.modelService, this.logger);

    this.plugin.api["device-manager/models"] = this.modelController.definition;

    this.plugin.imports.roles[RoleMeasureAdaptersAdmin.name] =
      RoleMeasureAdaptersAdmin.definition;
    this.plugin.imports.roles[RoleMeasureAdaptersReader.name] =
      RoleMeasureAdaptersReader.definition;
  }
}
