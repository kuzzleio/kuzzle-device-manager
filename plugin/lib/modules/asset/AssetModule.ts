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
import { KuzzleLogger } from "kuzzle-logger";
import { DeviceManagerPlugin } from "../plugin";

export class AssetModule extends Module {
  private assetService: AssetService;
  private assetHistoryService: AssetHistoryService;
  private assetController: AssetsController;
  private assetGroupsController: AssetsGroupsController;
  private assetsGroupsService: AssetsGroupsService;
  private logger: KuzzleLogger;
  private assetsGroupsLogger: KuzzleLogger;
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
    this.logger = this.plugin.context.logger.child("assets-module");
    this.assetsGroupsLogger = this.plugin.context.logger.child(
      "assetsGroups-module",
    );
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
    this.assetsGroupsService = new AssetsGroupsService(
      this.plugin,
      this.assetsGroupsLogger,
    );
    this.assetGroupsController = new AssetsGroupsController(
      this.plugin,
      this.assetsGroupsService,
      this.assetsGroupsLogger,
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
