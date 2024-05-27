import { JSONObject, KDocument } from "kuzzle-sdk";

import { DeviceContent } from "../../../modules/device";
import { AssetContent } from "../../../modules/asset";
import { Metadata } from "../../../modules/shared";

import { DecodedMeasurement, MeasureContent } from "./MeasureContent";
import { MeasureSource } from "./MeasureSources";

/**
 * @internal
 *
 * The device field is deprecated, refrain from using it as it will be removed later
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
 *
 * The device field is deprecated, refrain from using it as it will be removed later
 */
export type EventMeasureProcessBefore = {
  name: "device-manager:measures:process:before";

  args: [
    {
      source?: MeasureSource;
      asset: KDocument<AssetContent>;
      device?: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Tenant event before starting to process new measures.
 *
 * Useful to enrich measures before they are saved.
 *
 * The device field is deprecated, refrain from using it as it will be removed later
 */
export type TenantEventMeasureProcessBefore = {
  name: `engine:${string}:device-manager:measures:process:before`;

  args: [
    {
      source?: MeasureSource;
      asset: KDocument<AssetContent>;
      device?: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Event triggered after updating device and asset with new measures but
 * before persistence in database.
 *
 * The device field is deprecated, refrain from using it as it will be removed later
 */
export type EventMeasurePersistBefore = {
  name: "device-manager:measures:persist:before";

  args: [
    {
      source?: MeasureSource;
      asset: KDocument<AssetContent>;
      device?: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Tenant event triggered after updating device and asset with new measures but
 * before persistence in database.
 *
 * The device field is deprecated, refrain from using it as it will be removed later
 */
export type TenantEventMeasurePersistBefore = {
  name: `engine:${string}:device-manager:measures:persist:before`;

  args: [
    {
      source?: MeasureSource;
      asset: KDocument<AssetContent>;
      device?: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Event after processing new measures.
 *
 * The device field is deprecated, refrain from using it as it will be removed later
 */
export type EventMeasureProcessAfter = {
  name: "device-manager:measures:process:after";

  args: [
    {
      source?: MeasureSource;
      asset: KDocument<AssetContent>;
      device?: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Tenant event after processing new measures.
 *
 * The device field is deprecated, refrain from using it as it will be removed later
 */
export type TenantEventMeasureProcessAfter = {
  name: `engine:${string}:device-manager:measures:process:after`;

  args: [
    {
      source?: MeasureSource;
      asset: KDocument<AssetContent>;
      device?: KDocument<DeviceContent>;
      measures: MeasureContent[];
    },
  ];
};
