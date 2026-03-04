import { ApiMeasureTarget, DeviceMeasureTarget } from "./types/MeasureTarget";

export function toApiTarget(
  indexId: string,
  assetId: string,
  engineGroups?: string[],
): ApiMeasureTarget {
  return {
    assetId,
    engineGroups,
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
