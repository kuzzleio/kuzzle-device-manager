import { User } from "kuzzle";
import { KDocument } from "kuzzle-sdk";

import { Metadata } from "../../../modules/shared";

import { DeviceContent } from "./DeviceContent";

export type EventDeviceUpdateBefore = {
  name: "device-manager:device:update:before";

  args: [{ device: KDocument<DeviceContent>; metadata: Metadata }];
};

export type EventDeviceUpdateAfter = {
  name: "device-manager:device:update:after";

  args: [{ device: KDocument<DeviceContent>; metadata: Metadata }];
};

/**
 * @internal
 */
export type AskDeviceUnlinkAsset = {
  name: "ask:device-manager:device:unlink-asset";

  payload: {
    deviceId: string;
    user: User;
  };

  result: void;
};
