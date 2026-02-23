import { BadRequestError } from "kuzzle";
import {
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
      if (assetModel.engines?.length) {
        const sortedEngines = [...assetModel.engines].sort().join("+");
        return `model-asset-${assetModel.engineGroup}-${sortedEngines}-${ModelSerializer.title(type, model)}`;
      }
      return `model-asset-${ModelSerializer.title(type, model)}`;
    } else if (type === "device") {
      return `model-device-${ModelSerializer.title(type, model)}`;
    } else if (type === "group") {
      return `model-group-${ModelSerializer.title(type, model)}`;
    } else if (type === "measure") {
      return `model-measure-${ModelSerializer.title(type, model)}`;
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
    }

    throw new BadRequestError(`Unknown model type "${type}"`);
  }
}
