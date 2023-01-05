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
    this.deviceController = new DevicesController(this.deviceService);

    this.plugin.api["device-manager/devices"] =
      this.deviceController.definition;

    this.plugin.roles.push(RoleDevicesAdmin);
    this.plugin.roles.push(RoleDevicesPlatformAdmin);
    this.plugin.roles.push(RoleDevicesReader);
  }
}
