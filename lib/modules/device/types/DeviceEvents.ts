import { User } from "kuzzle";
import { KDocument } from "kuzzle-sdk";

import { DeviceModelContent } from "../../../modules/model";
import { Metadata } from "../../../modules/shared";

import { DeviceContent } from "./DeviceContent";
import { ApiDeviceLinkAssetsRequest } from "./DeviceApi";

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
export type AskDeviceLinkAsset = {
  name: "ask:device-manager:device:link-asset";

  payload: {
    engineId: string;
    assetId: string;
    deviceId: string;
    user: User;
    measureSlots: ApiDeviceLinkAssetsRequest["body"]["linkedMeasures"][0]["measureSlots"];
  };

  result: void;
};

export type AskDeviceUnlinkAsset = {
  name: "ask:device-manager:device:unlink-asset";

  payload: {
    deviceId: string;
    assetId: string;
    measureSlots: ApiDeviceLinkAssetsRequest["body"]["linkedMeasures"][0]["measureSlots"];
    allMeasures: undefined | boolean;
    user: User;
  };

  result: void;
};

export type AskDeviceDetachEngine = {
  name: "ask:device-manager:device:detach-engine";

  payload: {
    deviceId: string;
    user: User;
  };

  result: void;
};

export type AskDeviceAttachEngine = {
  name: "ask:device-manager:device:attach-engine";

  payload: {
    engineId: string;
    deviceId: string;
    user: User;
  };

  result: void;
};

export type AskDeviceRefreshModel = {
  name: "ask:device-manager:device:refresh-model";

  payload: {
    deviceModel: DeviceModelContent;
  };

  result: void;
};
