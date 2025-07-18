import { Module } from "../shared/Module";
import { GroupsController } from "./GroupsController";
import { GroupsService } from "./GroupsService";
import { RoleGroupsAdmin } from "./roles/RoleGroupsAdmin";
import { RoleGroupsReader } from "./roles/RoleGroupsReader";

export class GroupsModule extends Module {
  private groupsController: GroupsController;
  private groupsService: GroupsService;
  public async init(): Promise<void> {
    this.groupsService = new GroupsService(this.plugin);
    this.groupsController = new GroupsController(
      this.plugin,
      this.groupsService,
    );

    this.plugin.api["device-manager/groups"] = this.groupsController.definition;

    this.plugin.imports.roles[RoleGroupsAdmin.name] =
      RoleGroupsAdmin.definition;
    this.plugin.imports.roles[RoleGroupsReader.name] =
      RoleGroupsReader.definition;
  }
}
