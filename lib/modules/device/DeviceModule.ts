import { Module } from "../shared/Module";

import { DeviceController } from "./DeviceController";
import { DeviceService } from "./DeviceService";

export class DeviceModule extends Module {
  private deviceService: DeviceService;
  private deviceController: DeviceController;

  public async init(): Promise<void> {
    this.deviceService = new DeviceService(this.plugin);
    this.deviceController = new DeviceController(this.deviceService);

    this.plugin.api["device-manager/devices"] =
      this.deviceController.definition;
  }
}
