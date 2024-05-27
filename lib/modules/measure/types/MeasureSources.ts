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
  targetAssetId: string;
}

export function isSource(source: any): source is AbstractMeasureSource {
  if (!source) {
    return false;
  }

  return (
    typeof source.type === "string" &&
    typeof source.dataSourceId === "string" &&
    typeof source.targetIndexId === "string" &&
    typeof source.customMetadata === "object"
  );
}

export function isSourceDevice(source: any): source is DeviceMeasureSource {
  if (!isSource(source) && source.type !== "device") {
    return false;
  }

  return source.reference === "string" && source.model === "string";
}

export function isSourceAPI(source: any): source is APIMeasureSource {
  if (!isSource(source) && source.type !== "api") {
    return false;
  }

  return typeof source.targetAssetId === "string";
}

export type MeasureSource = DeviceMeasureSource | APIMeasureSource;
