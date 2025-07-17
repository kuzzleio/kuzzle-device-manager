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
export type EventMeasureProcessBefore = {
  name: "device-manager:measures:process:before";

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
export type TenantEventMeasureProcessBefore = {
  name: `engine:${string}:device-manager:measures:process:before`;

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
export type EventMeasureProcessAfter = {
  name: "device-manager:measures:process:after";

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
export type TenantEventMeasureProcessAfter = {
  name: `engine:${string}:device-manager:measures:process:after`;

  args: [
    {
      source: MeasureSource;
      target: MeasureTarget;
      asset?: AssetContent;
      measures: MeasureContent[];
    },
  ];
};
