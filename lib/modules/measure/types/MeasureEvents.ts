import { JSONObject } from "kuzzle";

import { Asset } from "../../../modules/asset";
import { Device } from "../../../modules/device";
import { Metadata } from "../../../modules/shared";

import { MeasureContent, Measurement } from "./MeasureContent";

/**
 * @internal
 */
export type EventMeasureIngest = {
  name: "device-manager:measures:ingest";

  args: [
    {
      device: Device;
      measurements: Measurement<JSONObject>[];
      metadata: Metadata;
      payloadUuids: string[];
    }
  ];
};

export type EventMeasureProcessBefore = {
  name: "device-manager:measures:process:before";

  args: [
    {
      asset: Asset;
      device: Device;
      measures: MeasureContent[];
    }
  ];
};

export type TenantEventMeasureProcessBefore = {
  name: `engine:${string}:device-manager:measures:process:before`;

  args: [
    {
      asset: Asset;
      device: Device;
      measures: MeasureContent[];
    }
  ];
};

export type EventMeasureProcessAfter = {
  name: "device-manager:measures:process:after";

  args: [
    {
      asset: Asset;
      device: Device;
      measures: MeasureContent[];
    }
  ];
};

export type TenantEventMeasureProcessAfter = {
  name: `engine:${string}:device-manager:measures:process:after`;

  args: [
    {
      asset: Asset;
      device: Device;
      measures: MeasureContent[];
    }
  ];
};
