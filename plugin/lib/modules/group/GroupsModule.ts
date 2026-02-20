import { DeviceManagerPlugin } from "../plugin";
import { Module } from "../shared/Module";
import { GroupsController } from "./GroupsController";
import { GroupsService } from "./GroupsService";
import { RoleGroupsAdmin } from "./roles/RoleGroupsAdmin";
import { RoleGroupsReader } from "./roles/RoleGroupsReader";
import { KuzzleLogger } from "kuzzle-logger";

export class GroupsModule extends Module {
  private groupsController: GroupsController;
  private groupsService: GroupsService;
  readonly logger: KuzzleLogger;

  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
    this.logger = this.plugin.context.logger.child("groups");
  }
  public async init(): Promise<void> {
    this.groupsService = new GroupsService(this.plugin, this.logger);
    this.groupsController = new GroupsController(
      this.plugin,
      this.groupsService,
      this.logger,
    );

    this.plugin.api["device-manager/groups"] = this.groupsController.definition;

    this.plugin.imports.roles[RoleGroupsAdmin.name] =
      RoleGroupsAdmin.definition;
    this.plugin.imports.roles[RoleGroupsReader.name] =
      RoleGroupsReader.definition;
  }
}
