import { Backend, EmbeddedSDK, User } from "kuzzle";

import { DeviceManagerPlugin, DeviceManagerConfiguration } from "../../plugin";

export abstract class BaseService {
  constructor(private plugin: DeviceManagerPlugin) {}

  protected get app(): Backend {
    return global.app;
  }

  protected get sdk(): EmbeddedSDK {
    return this.plugin.context.accessors.sdk;
  }

  protected get config(): DeviceManagerConfiguration {
    return this.plugin.config;
  }

  protected get impersonatedSdk() {
    return (user: User) => {
      if (user?._id) {
        return this.sdk.as(user, { checkRights: false });
      }

      return this.sdk;
    };
  }
}
