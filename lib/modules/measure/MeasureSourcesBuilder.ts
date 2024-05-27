import { Metadata } from "../shared";
import { MeasureOriginApi, MeasureOriginDevice } from "./types/MeasureContent";
import { APIMeasureSource, DeviceMeasureSource } from "./types/MeasureSources";

export function toApiSource(
  dataSourceId: string,
  targetAssetId: string,
  targetIndexId: string,
  customMetadata: Metadata = {},
  lastMeasuredAt?: number,
): APIMeasureSource {
  return {
    customMetadata,
    dataSourceId,
    lastMeasuredAt,
    targetAssetId,
    targetIndexId,
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
    payloadUuids: payloadUuids,
    type: "api",
  };
}

export function toDeviceSource(
  dataSourceId: string,
  reference: string,
  model: string,
  targetAssetId: string,
  targetIndexId: string,
  customMetadata: Metadata,
  lastMeasuredAt?: number,
): DeviceMeasureSource {
  return {
    customMetadata,
    dataSourceId,
    lastMeasuredAt,
    model,
    reference,
    targetAssetId,
    targetIndexId,
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
