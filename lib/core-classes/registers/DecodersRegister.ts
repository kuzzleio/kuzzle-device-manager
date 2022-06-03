import {
  ControllerDefinition,
  Inflector,
  KuzzleRequest,
  PluginContext,
  PluginImplementationError,
} from 'kuzzle';

import { Decoder } from '../Decoder';
import { DecoderContent } from '../../types/DecoderContent';
import { PayloadService } from '../PayloadService';

export class DecodersRegister {
  private context: PluginContext;
  private _decoders = new Map<string, Decoder>();

  private get sdk () {
    return this.context.accessors.sdk;
  }

  get decoders (): Decoder[] {
    return Array.from(this._decoders.values());
  }

  init (context: PluginContext) {
    this.context = context;
  }

  async list (): Promise<DecoderContent[]> {
    const decoders = this.decoders.map(decoder => decoder.serialize());

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
  register (decoder: Decoder) {
    decoder.action = decoder.action || Inflector.kebabCase(decoder.deviceModel);

    if (this._decoders.has(decoder.deviceModel)) {
      throw new PluginImplementationError(`Decoder for device model "${decoder.deviceModel}" already registered`);
    }

    this._decoders.set(decoder.deviceModel, decoder);

    return {
      action: decoder.action,
      controller: 'device-manager/payload',
    };
  }

  /**
   * Build the PayloadController with registered decoders
   *
   * @todo generate OpenAPI specification
   *
   * @internal
   */
  getPayloadController (payloadService: PayloadService): ControllerDefinition {
    const controllers: ControllerDefinition = { actions: {} };

    for (const decoder of this.decoders) {
      controllers.actions[decoder.action] = {
        handler: async (request: KuzzleRequest) => {
          const source = request.getBoolean('source');

          const ret = await payloadService.process(request, decoder);

          return source ? ret : undefined;
        },
        http: decoder.http,
      };
    }

    return controllers;
  }

  printDecoders () {
    for (const decoder of this.decoders) {
      this.context.log.info(`Decoder for "${decoder.deviceModel}" registered`);
    }
  }

  /**
   * Creates default roles, profiles and users associated to the generated actions
   * in the Payload controller.
   *
   * This method never returns a rejected promise.
   */
  async createDefaultRights () {
    try {
      await this.createDefaultRoles();
    }
    catch (error) {
      this.context.log.error(`Cannot register default decoders roles: ${error}${error.stack}`);
      return;
    }

    try {
      await this.createDefaultProfiles();
    }
    catch (error) {
      this.context.log.error(`Cannot register default decoders profiles: ${error}${error.stack}`);
      return;
    }

    try {
      await this.createDefaultUsers();
    }
    catch (error) {
      this.context.log.error(`Cannot register default decoders users: ${error}${error.stack}`);
    }
  }

  private async createDefaultUsers () {
    const promises = [];
    const gatewayUser = {
      content: {
        profileIds: []
      }
    };

    for (const decoder of this.decoders) {
      const userId = `payload-gateway.${decoder.action}`;
      const user = {
        content: {
          // each created user has only the profile of the same name
          profileIds: [userId]
        }
      };

      gatewayUser.content.profileIds.push(userId);

      promises.push(
        this.sdk.security.createUser(userId, user)
          .catch(error => {
            if (error.id !== 'security.user.already_exists') {
              throw error;
            }
            return this.sdk.security.updateUser(userId, user);
          })
      );
    }

    promises.push(
      this.sdk.security.createUser('payload-gateway', gatewayUser)
        .catch(error => {
          if (error.id !== 'security.user.already_exists') {
            throw error;
          }
          return this.sdk.security.updateUser('payload-gateway', gatewayUser);
        })
    );

    await Promise.all(promises);
  }

  private async createDefaultProfiles () {
    const promises = [];
    const gatewayProfile = {
      policies: []
    };

    for (const decoder of this.decoders) {
      const profileId = `payload-gateway.${decoder.action}`;
      const profile = {
        // each created profile has only the role of the same name
        policies: [ { roleId: profileId } ]
      };

      gatewayProfile.policies.push({ roleId: profileId });
      promises.push(this.sdk.security.createOrReplaceProfile(profileId, profile));
    }

    promises.push(this.sdk.security.createOrReplaceProfile('payload-gateway', gatewayProfile));

    await Promise.all(promises);
  }

  private async createDefaultRoles () {
    const promises = [];

    for (const decoder of this.decoders) {
      const roleId = `payload-gateway.${decoder.action}`;
      const role = {
        controllers: {
          'device-manager/payload': {
            actions: {
              [decoder.action]: true
            }
          }
        }
      };

      promises.push(this.sdk.security.createOrReplaceRole(roleId, role));
    }

    await Promise.all(promises);
  }
}
