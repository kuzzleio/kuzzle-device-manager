import { JSONObject } from "kuzzle-sdk";

import { AssetContent } from "../../../modules/asset";

import { DecodedMeasurement, MeasureContent } from "./MeasureContent";
import { MeasureSource } from "./MeasureSources";
import { MeasureTarget } from "./MeasureTarget";

/**
 * @internal
 */
export type AskMeasureSourceIngest = {
  name: "device-manager:measures:sourceIngest";

  payload: {
    source: MeasureSource;
    target: MeasureTarget;
    measurements: DecodedMeasurement<JSONObject>[];
    payloadUuids: string[];
  };

  result: void;
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
      target: MeasureTarget;
      asset?: AssetContent;
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
      target: MeasureTarget;
      asset?: AssetContent;
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
      target: MeasureTarget;
      asset?: AssetContent;
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
      target: MeasureTarget;
      asset?: AssetContent;
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
      target: MeasureTarget;
      asset?: AssetContent;
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
      target: MeasureTarget;
      asset?: AssetContent;
      measures: MeasureContent[];
    },
  ];
};
