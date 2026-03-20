import { BadRequestError } from "kuzzle";
import {
  ActionModelContent,
  AssetModelContent,
  DeviceModelContent,
  GroupModelContent,
  MeasureModelContent,
  ModelContent,
} from "./types/ModelContent";

export class ModelSerializer {
  static id<T extends ModelContent>(type: string, model: T) {
    if (type === "asset") {
      const assetModel = model as AssetModelContent;
      if (assetModel.engineIds?.length) {
        const sortedEngines = [...assetModel.engineIds].sort().join("+");
        const sortedGroups = [...assetModel.engineGroups].sort().join("+");
        return `model-asset-${sortedGroups}-${sortedEngines}-${ModelSerializer.title(type, model)}`;
      }
      if (assetModel.engineGroups.length > 1) {
        const sortedGroups = [...assetModel.engineGroups].sort().join("+");
        return `model-asset-${sortedGroups}-${ModelSerializer.title(type, model)}`;
      }
      return `model-asset-${ModelSerializer.title(type, model)}`;
    } else if (type === "device") {
      return `model-device-${ModelSerializer.title(type, model)}`;
    } else if (type === "group") {
      const groupModel = model as GroupModelContent;
      if (groupModel.engineGroups.length > 1) {
        const sortedGroups = [...groupModel.engineGroups].sort().join("+");
        return `model-group-${sortedGroups}-${ModelSerializer.title(type, model)}`;
      }
      return `model-group-${ModelSerializer.title(type, model)}`;
    } else if (type === "measure") {
      const measureModel = model as MeasureModelContent;
      if (measureModel.engineIds?.length) {
        const sortedEngines = [...measureModel.engineIds].sort().join("+");
        if (measureModel.engineGroups?.length) {
          const sortedGroups = [...measureModel.engineGroups].sort().join("+");
          return `model-measure-${sortedGroups}-${sortedEngines}-${ModelSerializer.title(type, model)}`;
        }
        return `model-measure-${sortedEngines}-${ModelSerializer.title(type, model)}`;
      }
      if (
        measureModel.engineGroups?.length &&
        measureModel.engineGroups.length > 1
      ) {
        const sortedGroups = [...measureModel.engineGroups].sort().join("+");
        return `model-measure-${sortedGroups}-${ModelSerializer.title(type, model)}`;
      }
      return `model-measure-${ModelSerializer.title(type, model)}`;
    } else if (type === "action") {
      const actionModel = model as ActionModelContent;
      if (actionModel.engineIds?.length) {
        const sortedEngines = [...actionModel.engineIds].sort().join("+");
        if (actionModel.engineGroups?.length) {
          const sortedGroups = [...actionModel.engineGroups].sort().join("+");
          return `model-action-${sortedGroups}-${sortedEngines}-${ModelSerializer.title(type, model)}`;
        }
        return `model-action-${sortedEngines}-${ModelSerializer.title(type, model)}`;
      }
      if (
        actionModel.engineGroups?.length &&
        actionModel.engineGroups.length > 1
      ) {
        const sortedGroups = [...actionModel.engineGroups].sort().join("+");
        return `model-action-${sortedGroups}-${ModelSerializer.title(type, model)}`;
      }
      return `model-action-${ModelSerializer.title(type, model)}`;
    }

    throw new BadRequestError(`Unknown model type "${type}"`);
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
    } else if (type === "action") {
      return (model as ActionModelContent).action.type;
    }

    throw new BadRequestError(`Unknown model type "${type}"`);
  }
}
