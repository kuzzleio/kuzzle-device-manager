import { Metadata } from "../../shared";

interface AbstractMeasureSource {
  type: string;
  id: string;
  metadata?: Metadata;
}

export interface DeviceMeasureSource extends AbstractMeasureSource {
  type: "device";
  reference: string;
  deviceMetadata: Metadata;
  model: string;
  lastMeasuredAt?: number;
}

export interface ApiMeasureSource extends AbstractMeasureSource {
  type: "api";
}

export function isSource(source: any): source is AbstractMeasureSource {
  if (!source) {
    return false;
  }

  if (source.metadata !== undefined && typeof source.metadata !== "object") {
    return false;
  }

  return typeof source.type === "string" && typeof source.id === "string";
}

export function isSourceDevice(source: any): source is DeviceMeasureSource {
  if (!isSource(source) && source.type !== "device") {
    return false;
  }

  if (
    source.lastMeasuredAt !== undefined &&
    typeof source.lastMeasuredAt !== "number"
  ) {
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
