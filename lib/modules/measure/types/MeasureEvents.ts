import { JSONObject, KDocument } from "kuzzle-sdk";

import { DeviceContent } from "../../../modules/device";
import { AssetContent } from "../../../modules/asset";
import { Metadata } from "../../../modules/shared";

import { DecodedMeasurement, MeasureContent } from "./MeasureContent";

/**
 * @internal
 */
export type AskMeasureIngest = {
  name: "device-manager:measures:ingest";

  payload: {
    device: KDocument<DeviceContent>;
    measurements: DecodedMeasurement<JSONObject>[];
    metadata: Metadata;
    payloadUuids: string[];
  };

  result: void;
};

/**
 * Event before starting to process new measures.
 *
 * Useful to enrich measures before they are saved.
 */
export type EventMeasureProcessBefore = {
  name: "device-manager:measures:process:before";

  args: [
    {
      asset: KDocument<AssetContent>;
      device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Tenant event before starting to process new measures.
 *
 * Useful to enrich measures before they are saved.
 */
export type TenantEventMeasureProcessBefore = {
  name: `engine:${string}:device-manager:measures:process:before`;

  args: [
    {
      asset: KDocument<AssetContent>;
      device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Event triggered after updating device and asset with new measures but
 * before persistence in database.
 */
export type EventMeasurePersistBefore = {
  name: "device-manager:measures:persist:before";

  args: [
    {
      asset: KDocument<AssetContent>;
      device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Tenant event triggered after updating device and asset with new measures but
 * before persistence in database.
 */
export type TenantEventMeasurePersistBefore = {
  name: `engine:${string}:device-manager:measures:persist:before`;

  args: [
    {
      asset: KDocument<AssetContent>;
      device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};

export type EventMeasureProcessAfter = {
  name: "device-manager:measures:process:after";

  args: [
    {
      asset: KDocument<AssetContent>;
      device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};

export type TenantEventMeasureProcessAfter = {
  name: `engine:${string}:device-manager:measures:process:after`;

  args: [
    {
      asset: KDocument<AssetContent>;
      device: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};
