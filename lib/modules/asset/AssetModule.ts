import { Module } from "../shared/Module";

import { AssetsController } from "./AssetsController";
import { AssetService } from "./AssetService";
import { RoleAssetsAdmin } from "./roles/RoleAssetsAdmin";
import { RoleAssetsReader } from "./roles/RoleAssetsReader";

export class AssetModule extends Module {
  private assetService: AssetService;
  private assetController: AssetsController;

  public async init(): Promise<void> {
    this.assetService = new AssetService(this.plugin);
    this.assetController = new AssetsController(this.assetService);

    this.plugin.api["device-manager/assets"] = this.assetController.definition;

    this.plugin.roles.push(RoleAssetsAdmin);
    this.plugin.roles.push(RoleAssetsReader);
  }
}
