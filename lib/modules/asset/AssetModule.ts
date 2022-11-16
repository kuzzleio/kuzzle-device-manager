import { Module } from "../shared/Module";

import { AssetsController } from "./AssetsController";
import { AssetService } from "./AssetService";
import { assetsAdmin } from "./roles/assetsAdmin";
import { assetsReader } from "./roles/assetsReader";

export class AssetModule extends Module {
  private assetService: AssetService;
  private assetController: AssetsController;

  public async init(): Promise<void> {
    this.assetService = new AssetService(this.plugin);
    this.assetController = new AssetsController(this.assetService);

    this.plugin.api["device-manager/assets"] = this.assetController.definition;

    this.plugin.roles["assets.admin"] = assetsAdmin;
    this.plugin.roles["assets.reader"] = assetsReader;
  }
}
