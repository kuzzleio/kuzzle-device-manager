import { DeviceManagerPlugin } from "../plugin";
import { Module } from "../shared/Module";

import { ModelsController } from "./ModelsController";
import { ModelService } from "./ModelService";
import { KuzzleLogger } from "kuzzle-logger";

export class ModelModule extends Module {
  private modelService: ModelService;
  private modelController: ModelsController;
  readonly logger: KuzzleLogger;

  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
    this.logger = this.plugin.context.logger.child("models-module");
  }

  public async init(): Promise<void> {
    this.modelService = new ModelService(this.plugin, this.logger);
    this.modelController = new ModelsController(this.modelService, this.logger);

    this.plugin.api["device-manager/models"] = this.modelController.definition;
  }
}
