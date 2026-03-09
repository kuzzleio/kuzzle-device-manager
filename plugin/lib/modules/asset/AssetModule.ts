import { Module } from "../shared/Module";

import { AssetHistoryService } from "./AssetHistoryService";
import { AssetsController } from "./AssetsController";
import { AssetService } from "./AssetService";
import { AssetsGroupsController } from "./AssetsGroupsController";
import { RoleAssetsAdmin } from "./roles/RoleAssetsAdmin";
import { RoleAssetsReader } from "./roles/RoleAssetsReader";
import { RoleAssetsGroupsAdmin } from "./roles/RoleAssetsGroupsAdmin";
import { RoleAssetsGroupsReader } from "./roles/RoleAssetsGroupsReader";
import * as specificRoles from "./roles/specificRoles";
import { AssetsGroupsService } from "./AssetsGroupsService";

export class AssetModule extends Module {
  private assetService: AssetService;
  private assetHistoryService: AssetHistoryService;
  private assetController: AssetsController;
  private assetGroupsController: AssetsGroupsController;
  private assetsGroupsService: AssetsGroupsService;

  public async init(): Promise<void> {
    this.assetHistoryService = new AssetHistoryService(this.plugin);
    this.assetService = new AssetService(this.plugin, this.assetHistoryService);
    this.assetController = new AssetsController(this.plugin, this.assetService);
    this.assetsGroupsService = new AssetsGroupsService(this.plugin);
    this.assetGroupsController = new AssetsGroupsController(
      this.plugin,
      this.assetsGroupsService,
    );

    this.plugin.api["device-manager/assetsGroup"] =
      this.assetGroupsController.definition;

    this.plugin.api["device-manager/assets"] = this.assetController.definition;

    this.plugin.imports.roles[RoleAssetsAdmin.name] =
      RoleAssetsAdmin.definition;
    this.plugin.imports.roles[RoleAssetsReader.name] =
      RoleAssetsReader.definition;
    for (const role in specificRoles) {
      if (specificRoles[role].name && specificRoles[role].definition) {
        this.plugin.imports.roles[specificRoles[role].name] =
          specificRoles[role].definition;
      }
    }
    this.plugin.imports.roles[RoleAssetsGroupsAdmin.name] =
      RoleAssetsGroupsAdmin.definition;
    this.plugin.imports.roles[RoleAssetsGroupsReader.name] =
      RoleAssetsGroupsReader.definition;
  }
}
