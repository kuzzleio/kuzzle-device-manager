import { Module } from "../shared/Module";
import { GroupsController } from "./GroupsController";
import { RoleGroupsAdmin } from "./roles/RoleGroupsAdmin";
import { RoleGroupsReader } from "./roles/RoleGroupsReader";

export class GroupModule extends Module {
  private groupsController: GroupsController;

  public async init(): Promise<void> {
    this.groupsController = new GroupsController(this.plugin);

    this.plugin.api["device-manager/groups"] = this.groupsController.definition;

    this.plugin.imports.roles[RoleGroupsAdmin.name] =
      RoleGroupsAdmin.definition;
    this.plugin.imports.roles[RoleGroupsReader.name] =
      RoleGroupsReader.definition;
  }
}
