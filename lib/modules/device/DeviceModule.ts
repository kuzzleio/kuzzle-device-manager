import { Module } from "../shared/Module";

import { DevicesController } from "./DevicesController";
import { DeviceService } from "./DeviceService";
import { RoleDevicesAdmin } from "./roles/RoleDevicesAdmin";
import { RoleDevicesPlatformAdmin } from "./roles/RoleDevicesPlatformAdmin";
import { RoleDevicesReader } from "./roles/RoleDevicesReader";

export class DeviceModule extends Module {
  private deviceService: DeviceService;
  private deviceController: DevicesController;

  public async init(): Promise<void> {
    this.deviceService = new DeviceService(this.plugin);
    this.deviceController = new DevicesController(
      this.plugin,
      this.deviceService,
    );

    this.plugin.api["device-manager/devices"] =
      this.deviceController.definition;

    this.plugin.imports.roles[RoleDevicesAdmin.name] =
      RoleDevicesAdmin.definition;
    this.plugin.imports.roles[RoleDevicesPlatformAdmin.name] =
      RoleDevicesPlatformAdmin.definition;
    this.plugin.imports.roles[RoleDevicesReader.name] =
      RoleDevicesReader.definition;
  }
}
