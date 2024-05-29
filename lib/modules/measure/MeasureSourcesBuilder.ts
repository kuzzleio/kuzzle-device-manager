import { Metadata } from "../shared";
import { MeasureOriginApi, MeasureOriginDevice } from "./types/MeasureContent";
import { APIMeasureSource, DeviceMeasureSource } from "./types/MeasureSources";

export function toApiSource(
  dataSourceId: string,
  metadata: Metadata = {},
  lastMeasuredAt?: number,
): APIMeasureSource {
  return {
    dataSourceId,
    lastMeasuredAt,
    metadata,
    type: "api",
  };
}

export function apiSourceToOriginApi(
  source: APIMeasureSource,
  measureName: string,
  payloadUuids: string[],
): MeasureOriginApi {
  return {
    _id: source.dataSourceId,
    measureName,
    metadata: source.metadata,
    payloadUuids: payloadUuids,
    type: "api",
  };
}

export function toDeviceSource(
  dataSourceId: string,
  reference: string,
  model: string,
  metadata: Metadata = {},
  lastMeasuredAt?: number,
): DeviceMeasureSource {
  return {
    dataSourceId,
    lastMeasuredAt,
    metadata,
    model,
    reference,
    type: "device",
  };
}

export function deviceSourceToOriginDevice(
  source: DeviceMeasureSource,
  measureName: string,
  payloadUuids: string[],
): MeasureOriginDevice {
  const { dataSourceId, model, reference } = source;
  return {
    _id: dataSourceId,
    deviceModel: model,
    measureName,
    metadata: source.metadata,
    payloadUuids,
    reference: reference,
    type: "device",
  };
}
