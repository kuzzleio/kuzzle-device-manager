import { DeviceManagerPlugin } from "../../core/DeviceManagerPlugin";

export abstract class Module {
  protected plugin: DeviceManagerPlugin;

  protected get sdk() {
    return this.plugin.context.accessors.sdk;
  }

  constructor(plugin: DeviceManagerPlugin) {
    this.plugin = plugin;
  }

  abstract init(): Promise<void>;
}
