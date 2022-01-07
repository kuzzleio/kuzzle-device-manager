import {
  PluginContext,
  EmbeddedSDK,
  Plugin,
  ControllerDefinition,
} from 'kuzzle';

import { Decoder } from './Decoder';
import { DecoderContent } from '../types/decoders/DecodersContent';
import { DeviceManagerConfig } from '../DeviceManagerPlugin';
import { PayloadHandler } from '../../index';
import { PayloadService } from './PayloadService';

export class DecodersService {
  private config: DeviceManagerConfig;
  private context: PluginContext;

  private _decoders: Map<string, Decoder>;
  private handlers: { decoder: Decoder, handler: PayloadHandler }[];

  get sdk (): EmbeddedSDK {
    return this.context.accessors.sdk;
  }

  get decoders (): Map<string, Decoder> {
    return this._decoders;
  }

  constructor (plugin: Plugin, decoders: { decoder: Decoder, handler: PayloadHandler }[]) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.handlers = decoders
    this._decoders = new Map();


    for (const { decoder } of this.handlers) {
      this.register(decoder);
    }

    this.printDecoders();
  }

  async list(): Promise<DecoderContent[]> {
    const decoders = Array
      .from(this._decoders.values())
      .map(decoder => decoder.serialize())

    return decoders;
  }

  register (decoder: Decoder): void {
    this.decoders.set(decoder.deviceModel, decoder);
  }

  buildPayloadController (payloadService: PayloadService): ControllerDefinition {
    const controllers: ControllerDefinition = { actions: {} };

    for (const { decoder, handler } of this.handlers) {
      controllers.actions[decoder.action] = {
        handler: request => handler ? handler(request, decoder) : payloadService.process(request, decoder),
        http: decoder.http,
      };
    }

    return controllers;
  }

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

    for (const { decoder } of this.handlers) {
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

    for (const { decoder } of this.handlers) {
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

    for (const { decoder } of this.handlers) {
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

  private printDecoders (): void {
    for (const decoder of this._decoders.values()) {
      this.context.log.info(`Register API action "device-manager/payload:${decoder.action}" with decoder "${decoder.constructor.name}" for device "${decoder.deviceModel}"`);
    }
  }
}
