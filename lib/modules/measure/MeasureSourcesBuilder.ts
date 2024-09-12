import { Metadata } from "../shared";
import { MeasureOriginApi, MeasureOriginDevice } from "./types/MeasureContent";
import { ApiMeasureSource, DeviceMeasureSource } from "./types/MeasureSources";

const enum DATA_SOURCE_METADATA_TYPE {
  API = "api",
  DEVICE = "device",
}

export function toApiSource(
  dataSourceId: string,
  metadata?: Metadata,
  lastMeasuredAt?: number,
): ApiMeasureSource {
  return {
    dataSourceId,
    lastMeasuredAt,
    metadata,
    type: DATA_SOURCE_METADATA_TYPE.API,
  };
}

export function apiSourceToOriginApi(
  source: ApiMeasureSource,
  payloadUuids: string[],
): MeasureOriginApi {
  return {
    _id: source.dataSourceId,
    apiMetadata: source.metadata,
    payloadUuids: payloadUuids,
    type: DATA_SOURCE_METADATA_TYPE.API,
  };
}

export function toDeviceSource(
  dataSourceId: string,
  reference: string,
  model: string,
  metadata?: Metadata,
  lastMeasuredAt?: number,
): DeviceMeasureSource {
  return {
    dataSourceId,
    lastMeasuredAt,
    metadata,
    model,
    reference,
    type: DATA_SOURCE_METADATA_TYPE.DEVICE,
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
    type: DATA_SOURCE_METADATA_TYPE.DEVICE,
  };
}
