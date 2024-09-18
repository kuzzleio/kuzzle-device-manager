import { ApiMeasureTarget, DeviceMeasureTarget } from "./types/MeasureTarget";

export function toApiTarget(
  indexId: string,
  assetId: string,
  engineGroup?: string,
): ApiMeasureTarget {
  return {
    assetId,
    engineGroup,
    indexId,
    type: "api",
  };
}

export function toDeviceTarget(
  indexId: string,
  assetId?: string,
): DeviceMeasureTarget {
  return {
    assetId,
    indexId,
    type: "device",
  };
}
