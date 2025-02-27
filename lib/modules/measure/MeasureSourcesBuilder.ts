import { Metadata } from "../shared";
import { MeasureOriginApi, MeasureOriginDevice } from "./types/MeasureContent";
import { ApiMeasureSource, DeviceMeasureSource } from "./types/MeasureSources";

export const enum DATA_SOURCE_METADATA_TYPE {
  API = "api",
  DEVICE = "device",
}

export function apiSourceToOriginApi(
  source: ApiMeasureSource,
  payloadUuids: string[],
): MeasureOriginApi {
  return {
    _id: source.id,
    apiMetadata: source.metadata,
    payloadUuids: payloadUuids,
    type: DATA_SOURCE_METADATA_TYPE.API,
  };
}

export function deviceSourceToOriginDevice(
  source: DeviceMeasureSource,
  measureName: string,
  payloadUuids: string[],
  deviceMetadata: Metadata,
): MeasureOriginDevice {
  const { id: dataSourceId, model, reference } = source;
  return {
    _id: dataSourceId,
    deviceMetadata,
    deviceModel: model,
    measureName,
    metadata: source.metadata,
    payloadUuids,
    reference: reference,
    type: DATA_SOURCE_METADATA_TYPE.DEVICE,
  };
}
