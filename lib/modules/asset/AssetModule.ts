import { Module } from "../shared/Module";

import { AssetController } from "./AssetController";
import { AssetService } from "./AssetService";

export class AssetModule extends Module {
  private assetService: AssetService;
  private assetController: AssetController;

  public async init(): Promise<void> {
    this.assetService = new AssetService(this.plugin);
    this.assetController = new AssetController(this.assetService);

    this.plugin.api["device-manager/assets"] = this.assetController.definition;
  }
}
