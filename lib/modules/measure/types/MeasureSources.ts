import { Metadata } from "../../shared";

interface AbstractMeasureSource {
  type: string;
  dataSourceId: string;
  metadata?: Metadata;
  lastMeasuredAt?: number;
}

export interface DeviceMeasureSource extends AbstractMeasureSource {
  type: "device";
  reference: string;
  model: string;
}

export interface ApiMeasureSource extends AbstractMeasureSource {
  type: "api";
}

export function isSource(source: any): source is AbstractMeasureSource {
  if (!source) {
    return false;
  }

  if (source.metadata && typeof source.metadata !== "object") {
    return false;
  }

  if (source.lastMeasuredAt && typeof source.lastMeasuredAt !== "number") {
    return false;
  }

  return (
    typeof source.type === "string" && typeof source.dataSourceId === "string"
  );
}

export function isSourceDevice(source: any): source is DeviceMeasureSource {
  if (!isSource(source) && source.type !== "device") {
    return false;
  }

  return (
    typeof source.reference === "string" && typeof source.model === "string"
  );
}

export function isSourceApi(source: any): source is ApiMeasureSource {
  return isSource(source) && source.type === "api";
}

export type MeasureSource = DeviceMeasureSource | ApiMeasureSource;
