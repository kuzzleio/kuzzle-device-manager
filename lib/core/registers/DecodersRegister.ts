import {
  BadRequestError,
  Inflector,
  PluginContext,
  PluginImplementationError,
} from "kuzzle";
import { snakeCase } from "../../modules/shared";

import { Decoder, DecoderContent } from "../../modules/decoder";
import { DeviceManagerPlugin } from "..";

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
        `Decoder "${decoder.deviceModel}" did not declare any measures in the "decoder.measures" property.`
      );
    }

    if (this._decoders.has(decoder.deviceModel)) {
      throw new PluginImplementationError(
        `Decoder for device model "${decoder.deviceModel}" already registered`
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
   * Register default roles, profiles and users associated to the generated actions
   * in the Payload controller.
   */
  registerDefaultRights() {
    if (this.decoders.length === 0) {
      return;
    }

    this.registerDefaultRoles();

    this.registerDefaultProfiles();

    this.registerDefaultUsers();
  }

  private registerDefaultUsers() {
    const gatewayUser = {
      content: {
        profileIds: [],
      },
    };

    for (const decoder of this.decoders) {
      const userId = `payload_gateway.${snakeCase(decoder.action)}`;
      const user = {
        content: {
          // each created user has only the profile of the same name
          profileIds: [userId],
        },
      };

      gatewayUser.content.profileIds.push(userId);

      this.plugin.imports.users[userId] = user;
    }

    this.plugin.imports.users.payload_gateway = gatewayUser;
  }

  private registerDefaultProfiles() {
    const gatewayProfile = {
      policies: [],
    };

    for (const decoder of this.decoders) {
      const profileId = `payload_gateway.${snakeCase(decoder.action)}`;
      const profile = {
        // each created profile has only the role of the same name
        policies: [{ roleId: profileId }],
      };

      gatewayProfile.policies.push({ roleId: profileId });

      this.plugin.imports.profiles[profileId] = profile;
    }

    this.plugin.imports.profiles.payload_gateway = gatewayProfile;
  }

  private registerDefaultRoles() {
    for (const decoder of this.decoders) {
      const roleId = `payload_gateway.${snakeCase(decoder.action)}`;
      const role = {
        controllers: {
          "device-manager/payloads": {
            actions: {
              [decoder.action]: true,
            },
          },
        },
      };

      this.plugin.imports.roles[roleId] = role;
    }
  }
}
