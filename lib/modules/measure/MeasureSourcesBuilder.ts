import { Metadata } from "../shared";
import { MeasureOriginApi, MeasureOriginDevice } from "./types/MeasureContent";
import { APIMeasureSource, DeviceMeasureSource } from "./types/MeasureSources";

export function toApiSource(
  dataSourceId: string,
  assetId: string,
  indexId: string,
  customMetadata: Metadata = {},
  lastMeasuredAt?: number,
): APIMeasureSource {
  return {
    assetId,
    customMetadata,
    dataSourceId,
    indexId,
    lastMeasuredAt,
    type: "api",
  };
}

export function apiSourceToOriginApi(
  source: APIMeasureSource,
  measureName: string,
): MeasureOriginApi {
  return {
    _id: source.dataSourceId,
    measureName,
    payloadUuids: [],
    type: "api",
  };
}

export function toDeviceSource(
  dataSourceId: string,
  reference: string,
  model: string,
  assetId: string,
  indexId: string,
  customMetadata: Metadata,
  lastMeasuredAt?: number,
): DeviceMeasureSource {
  return {
    assetId,
    customMetadata,
    dataSourceId,
    indexId,
    lastMeasuredAt,
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
    payloadUuids,
    reference: reference,
    type: "device",
  };
}
