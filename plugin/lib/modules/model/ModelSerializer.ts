import { BadRequestError } from "kuzzle";
import {
  AssetModelContent,
  DeviceModelContent,
  GroupModelContent,
  MeasureModelContent,
  ModelContent,
} from "./types/ModelContent";

/**
 * Code-unit order (same as the default `Array#sort`), since it is part of persisted model IDs
 */
function compareCodeUnits(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

function joinSorted(values: string[]): string {
  return [...values].sort(compareCodeUnits).join("+");
}

export class ModelSerializer {
  static id<T extends ModelContent>(type: string, model: T) {
    if (type === "asset") {
      return ModelSerializer.assetId(model as AssetModelContent);
    } else if (type === "device") {
      return `model-device-${ModelSerializer.title(type, model)}`;
    } else if (type === "group") {
      return ModelSerializer.groupId(model as GroupModelContent);
    } else if (type === "measure") {
      return ModelSerializer.measureId(model as MeasureModelContent);
    }

    throw new BadRequestError(`Unknown model type "${type}"`);
  }

  private static assetId(assetModel: AssetModelContent) {
    const title = ModelSerializer.title("asset", assetModel);
    if (assetModel.indexes?.length) {
      return `model-asset-${joinSorted(assetModel.indexes)}-${title}`;
    }
    if (assetModel.tenantClasses.length > 1) {
      return `model-asset-${joinSorted(assetModel.tenantClasses)}-${title}`;
    }
    return `model-asset-${title}`;
  }

  private static groupId(groupModel: GroupModelContent) {
    const title = ModelSerializer.title("group", groupModel);
    if (groupModel.tenantClasses.length > 1) {
      return `model-group-${joinSorted(groupModel.tenantClasses)}-${title}`;
    }
    return `model-group-${title}`;
  }

  private static measureId(measureModel: MeasureModelContent) {
    const title = ModelSerializer.title("measure", measureModel);
    if (measureModel.indexes?.length) {
      const sortedEngines = joinSorted(measureModel.indexes);
      if (measureModel.tenantClasses?.length) {
        return `model-measure-${joinSorted(measureModel.tenantClasses)}-${sortedEngines}-${title}`;
      }
      return `model-measure-${sortedEngines}-${title}`;
    }
    if (
      measureModel.tenantClasses?.length &&
      measureModel.tenantClasses.length > 1
    ) {
      return `model-measure-${joinSorted(measureModel.tenantClasses)}-${title}`;
    }
    return `model-measure-${title}`;
  }

  static title<T extends ModelContent>(type: string, model: T) {
    if (type === "asset") {
      return (model as AssetModelContent).asset.model;
    } else if (type === "device") {
      return (model as DeviceModelContent).device.model;
    } else if (type === "group") {
      return (model as GroupModelContent).group.model;
    } else if (type === "measure") {
      return (model as MeasureModelContent).measure.type;
    }

    throw new BadRequestError(`Unknown model type "${type}"`);
  }
}
