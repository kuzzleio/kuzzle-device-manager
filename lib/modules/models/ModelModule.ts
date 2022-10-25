import { Module } from "../shared/Module";

import { ModelsController } from "./ModelsController";
import { ModelService } from "./ModelService";

export class ModelModule extends Module {
  private modelService: ModelService;
  private modelController: ModelsController;

  public async init(): Promise<void> {
    this.modelService = new ModelService(this.plugin);
    this.modelController = new ModelsController(this.modelService);

    this.plugin.api["model-manager/models"] = this.modelController.definition;
  }
}
