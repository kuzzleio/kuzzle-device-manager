import { ApiMeasureTarget, DeviceMeasureTarget } from "./types/MeasureTarget";

export function toApiTarget(
  indexId: string,
  assetId: string,
  tenantClasses?: string[],
): ApiMeasureTarget {
  return {
    assetId,
    tenantClasses,
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
