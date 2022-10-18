import { KDocument } from "kuzzle";

import { AssetContent } from "../../../modules/asset";
import { DeviceContent } from "./DeviceContent";

export interface DeviceControllerRequest {
  controller: 'device-manager/devices';

  engineId: string;
}

export interface DeviceUnlinkAssetRequest extends DeviceControllerRequest {
  action: 'update';

  _id: string;

  strict?: boolean;

  refresh?: string;
}
export type DeviceUnlinkAssetResult = {
  asset: KDocument<AssetContent>;
  device: KDocument<DeviceContent>;
};
