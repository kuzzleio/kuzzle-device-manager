import { Module } from "../shared/Module";

import { DevicesController } from "./DevicesController";
import { DeviceService } from "./DeviceService";
import { devicesAdmin } from "./roles/devicesAdmin";
import { devicesReader } from "./roles/devicesReader";

export class DeviceModule extends Module {
  private deviceService: DeviceService;
  private deviceController: DevicesController;

  public async init(): Promise<void> {
    this.deviceService = new DeviceService(this.plugin);
    this.deviceController = new DevicesController(this.deviceService);

    this.plugin.api["device-manager/devices"] =
      this.deviceController.definition;

    this.plugin.roles["devices.admin"] = devicesAdmin;
    this.plugin.roles["devices.reader"] = devicesReader;
  }
}
