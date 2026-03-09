import {
  BadRequestError,
  Inflector,
  PluginContext,
  PluginImplementationError,
} from "kuzzle";

import { DeviceManagerPlugin } from "../plugin";

import { Decoder } from "./Decoder";
import { DecoderContent } from "./exports";

export class DecodersRegister {
  private context: PluginContext;
  private plugin: DeviceManagerPlugin;

  /**
   * Map<deviceModel, Decoder>
   */
  private _decoders = new Map<string, Decoder>();

  private get sdk() {
    return this.context.accessors.sdk;
  }

  get decoders(): Decoder[] {
    return Array.from(this._decoders.values());
  }

  init(plugin: DeviceManagerPlugin, context: PluginContext) {
    this.plugin = plugin;
    this.context = context;
  }

  get(deviceModel: string): Decoder {
    if (!this._decoders.has(deviceModel)) {
      throw new BadRequestError(`Cannot find decoder for "${deviceModel}"`);
    }

    return this._decoders.get(deviceModel);
  }

  list(): DecoderContent[] {
    const decoders = this.decoders.map((decoder) => decoder.serialize());

    return decoders;
  }

  /**
   * Registers a new decoder for a device model.
   * Decoder and device models share a 1:1 relationship
   *
   * This will register a new API action:
   *  - controller: `device-manager/payload`
   *  - action: `action` property of the decoder or the device model in kebab-case
   *
   * @param decoder Instantiated decoder
   *
   * @returns Corresponding API action requestPayload
   */
  register(decoder: Decoder) {
    if (!decoder.deviceModel) {
      decoder.deviceModel = decoder.constructor.name.replace("Decoder", "");
    }

    decoder.action = decoder.action || Inflector.kebabCase(decoder.deviceModel);

    if (decoder.measures.length === 0) {
      throw new PluginImplementationError(
        `Decoder "${decoder.deviceModel}" did not declare any measures in the "decoder.measures" property.`,
      );
    }

    if (this._decoders.has(decoder.deviceModel)) {
      throw new PluginImplementationError(
        `Decoder for device model "${decoder.deviceModel}" already registered`,
      );
    }

    this._decoders.set(decoder.deviceModel, decoder);

    return {
      action: decoder.action,
      controller: "device-manager/payloads",
    };
  }

  printDecoders() {
    for (const decoder of this.decoders) {
      this.context.log.info(`Decoder for "${decoder.deviceModel}" registered`);
    }
  }

  /**
   * Register default role, profile and user associated to the generated actions
   * in the Payload controller.
   */
  registerDefaultRights() {
    if (this.decoders.length === 0) {
      return;
    }

    this.registerDefaultRole();

    this.registerDefaultProfile();

    this.registerDefaultUser();
  }

  private registerDefaultUser() {
    const gatewayUser = {
      content: {
        profileIds: ["payload_gateway"],
      },
    };

    this.plugin.imports.users.payload_gateway = gatewayUser;
  }

  private registerDefaultProfile() {
    const gatewayProfile = {
      policies: [{ roleId: "payload_gateway" }],
    };

    this.plugin.imports.profiles.payload_gateway = gatewayProfile;
  }

  private registerDefaultRole() {
    const role = {
      controllers: {
        "device-manager/decoders": {
          actions: {
            route: true,
          },
        },
        "device-manager/payloads": {
          actions: {
            "*": true,
          },
        },
      },
    };

    this.plugin.imports.roles.payload_gateway = role;
  }
}
