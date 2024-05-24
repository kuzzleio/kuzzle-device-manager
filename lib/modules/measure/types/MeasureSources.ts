import { Metadata } from "../../shared";

interface AbstractMeasureSource {
  type: string;
  dataSourceId: string;
  targetIndexId: string;
  targetAssetId?: string;
  customMetadata: Metadata;
  lastMeasuredAt?: number;
}

export interface DeviceMeasureSource extends AbstractMeasureSource {
  type: "device";
  reference: string;
  model: string;
}

export interface APIMeasureSource extends AbstractMeasureSource {
  type: "api";
}

export function isSourceDevice(source: any): source is DeviceMeasureSource {
  return source?.type === "device";
}

export function isSourceAPI(source: any): source is APIMeasureSource {
  return source?.type === "api";
}

export type MeasureSource = DeviceMeasureSource | APIMeasureSource;
