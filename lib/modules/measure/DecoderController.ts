import { ControllerDefinition, PluginContext } from "kuzzle";

import { DeviceManagerPlugin } from "./../../DeviceManagerPlugin";
import { DeviceManagerConfiguration } from "./../engine";

import { DecodersRegister } from "./DecodersRegister";

export class DecoderController {
  private context: PluginContext;
  private config: DeviceManagerConfiguration;
  private decodersRegister: DecodersRegister;

  public definition: ControllerDefinition;

  constructor(plugin: DeviceManagerPlugin, decodersRegister: DecodersRegister) {
    this.context = plugin.context;
    this.config = plugin.config;
    this.decodersRegister = decodersRegister;

    this.definition = {
      actions: {
        list: {
          handler: this.list.bind(this),
          http: [{ path: "device-manager/decoders", verb: "get" }],
        },
      },
    };
  }

  /**
   * List all available decoders
   */
  async list() {
    const decoders = this.decodersRegister.list();

    return { decoders };
  }
}
