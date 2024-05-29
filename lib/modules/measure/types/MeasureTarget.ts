interface AbstractMeasureTarget {
  type: string;
  assetId?: string;
  indexId: string;
}

export interface DeviceMeasureTarget extends AbstractMeasureTarget {
  type: "device";
}

export interface APIMeasureTarget extends AbstractMeasureTarget {
  type: "api";
  assetId: string;
  engineGroup?: string;
}

export function isTarget(target: any): target is AbstractMeasureTarget {
  if (!target) {
    return false;
  }

  if (target.assetId && typeof target.assetId !== "string") {
    return false;
  }

  return typeof target.type === "string" && typeof target.indexId === "string";
}

export function isTargetDevice(target: any): target is DeviceMeasureTarget {
  return isTarget(target) && target.type === "device";
}

export function isTargetAPI(target: any): target is APIMeasureTarget {
  if (!isTarget(target) && target.type !== "api") {
    return false;
  }

  if (target.engineGroup && typeof target.engineGroup !== "string") {
    return false;
  }

  return typeof target.assetId === "string";
}

export type MeasureTarget = DeviceMeasureTarget | APIMeasureTarget;
