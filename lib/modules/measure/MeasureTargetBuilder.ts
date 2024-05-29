import { APIMeasureTarget, DeviceMeasureTarget } from "./types/MeasureTarget";

export function toAPITarget(
  indexId: string,
  assetId: string,
  engineGroup?: string,
): APIMeasureTarget {
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
