import { DeviceManagerPlugin } from "../plugin";
import { Module } from "../shared/Module";

import { AssetHistoryService } from "./AssetHistoryService";
import { AssetsController } from "./AssetsController";
import { AssetService } from "./AssetService";
import { RoleAssetsAdmin } from "./roles/RoleAssetsAdmin";
import { RoleAssetsReader } from "./roles/RoleAssetsReader";
import * as specificRoles from "./roles/specificRoles";
import { KuzzleLogger } from "kuzzle-logger";
export class AssetModule extends Module {
  private assetService: AssetService;
  private assetHistoryService: AssetHistoryService;
  private assetController: AssetsController;
  private logger: KuzzleLogger;

  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
    this.logger = this.plugin.context.logger.child("assets");
  }
  public async init(): Promise<void> {
    this.assetHistoryService = new AssetHistoryService(
      this.plugin,
      this.logger,
    );
    this.assetService = new AssetService(
      this.plugin,
      this.assetHistoryService,
      this.logger,
    );
    this.assetController = new AssetsController(
      this.plugin,
      this.assetService,
      this.logger,
    );
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
  }
}
