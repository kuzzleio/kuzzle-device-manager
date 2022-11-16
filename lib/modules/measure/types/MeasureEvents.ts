import { JSONObject, KDocument } from "kuzzle";

import { DeviceContent } from "../../../modules/device";
import { AssetContent } from "../../../modules/asset";
import { Metadata } from "../../../modules/shared";

import { DecodedMeasurement, MeasureContent } from "./MeasureContent";

/**
 * @internal
 */
export type EventMeasureIngest = {
  name: "device-manager:measures:ingest";

  args: [
    {
      device: KDocument<DeviceContent>;
      measurements: DecodedMeasurement<JSONObject>[];
      metadata: Metadata;
      payloadUuids: string[];
    }
  ];
};

export type EventMeasureProcessBefore = {
  name: "device-manager:measures:process:before";

  args: [
    {
      readonly asset: KDocument<AssetContent>;
      readonly device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    }
  ];
};

export type TenantEventMeasureProcessBefore = {
  name: `engine:${string}:device-manager:measures:process:before`;

  args: [
    {
      readonly asset: KDocument<AssetContent>;
      readonly device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    }
  ];
};

export type EventMeasureProcessAfter = {
  name: "device-manager:measures:process:after";

  args: [
    {
      asset: KDocument<AssetContent>;
      device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    }
  ];
};

export type TenantEventMeasureProcessAfter = {
  name: `engine:${string}:device-manager:measures:process:after`;

  args: [
    {
      asset: KDocument<AssetContent>;
      device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    }
  ];
};
