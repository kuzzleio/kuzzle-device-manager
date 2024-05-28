import { JSONObject, KDocument } from "kuzzle-sdk";

import { DeviceContent } from "../../../modules/device";
import { AssetContent } from "../../../modules/asset";
import { Metadata } from "../../../modules/shared";

import { DecodedMeasurement, MeasureContent } from "./MeasureContent";
import { MeasureSource } from "./MeasureSources";

/**
 * @internal
 *
 * @deprecated Replaced by new Ask implementing data sources
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
 * @internal
 */
export type AskMeasureSourceIngest = {
  name: "device-manager:measures:sourceIngest";

  payload: {
    source: MeasureSource;
    measurements: DecodedMeasurement<JSONObject>[];
    payloadUuids: string[];
  };

  result: void;
};

/**
 * Event before starting to process new measures.
 *
 * Useful to enrich measures before they are saved.
 *
 * @deprecated Replaced by new triggers implementing data sources
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
 * Event before starting to process new measures from data source.
 *
 * Useful to enrich measures before they are saved.
 */
export type EventMeasureProcessSourceBefore = {
  name: "device-manager:measures:process:sourceBefore";

  args: [
    {
      source: MeasureSource;
      asset?: AssetContent;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Tenant event before starting to process new measures.
 *
 * Useful to enrich measures before they are saved.
 *
 * @deprecated Replaced by new triggers implementing data sources
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
 * Tenant event before starting to process new measures from data source.
 *
 * Useful to enrich measures before they are saved.
 */
export type TenantEventMeasureProcessSourceBefore = {
  name: `engine:${string}:device-manager:measures:process:sourceBefore`;

  args: [
    {
      source: MeasureSource;
      asset?: AssetContent;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Event triggered after updating device and asset with new measures but
 * before persistence in database.
 *
 * @deprecated Replaced by new triggers implementing data sources
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
 * Event triggered after updating the data source and asset with new measures but
 * before persistence in database.
 */
export type EventMeasurePersistSourceBefore = {
  name: "device-manager:measures:persist:sourceBefore";

  args: [
    {
      source: MeasureSource;
      asset?: AssetContent;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Tenant event triggered after updating device and asset with new measures but
 * before persistence in database.
 *
 * @deprecated Replaced by new triggers implementing data sources
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

/**
 * Tenant event triggered after updating the data source and asset with new measures but
 * before persistence in database.
 */
export type TenantEventMeasurePersistSourceBefore = {
  name: `engine:${string}:device-manager:measures:persist:sourceBefore`;

  args: [
    {
      source: MeasureSource;
      asset?: AssetContent;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Event after processing new measures.
 *
 * @deprecated Replaced by new triggers implementing data sources
 */
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

/**
 * Event after processing new measures from data source.
 */
export type EventMeasureProcessSourceAfter = {
  name: "device-manager:measures:process:sourceAfter";

  args: [
    {
      source: MeasureSource;
      asset?: AssetContent;
      measures: MeasureContent[];
    },
  ];
};

/**
 * Tenant event after processing new measures.
 *
 * @deprecated Replaced by new triggers implementing data sources
 */
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

/**
 * Tenant event after processing new measures from data source.
 *
 */
export type TenantEventMeasureProcessSourceAfter = {
  name: `engine:${string}:device-manager:measures:process:sourceAfter`;

  args: [
    {
      source: MeasureSource;
      asset?: AssetContent;
      measures: MeasureContent[];
    },
  ];
};
