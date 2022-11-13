import { ControllerDefinition, KuzzleRequest } from "kuzzle";

import { MeasureUnit } from "../measure";
import { ModelService } from "./ModelService";
import {
  ApiModelCreateAssetResult,
  ApiModelCreateDeviceResult,
  ApiModelCreateMeasureResult,
  ApiModelDeleteAssetResult,
  ApiModelDeleteDeviceResult,
  ApiModelDeleteMeasureResult,
  ApiModelListAssetsResult,
  ApiModelListDevicesResult,
  ApiModelListMeasuresResult,
} from "./types/ModelApi";

export class ModelsController {
  private modelService: ModelService;

  public definition: ControllerDefinition;

  constructor(modelService: ModelService) {
    this.modelService = modelService;

    this.definition = {
      actions: {
        deleteAsset: {
          handler: this.deleteAsset.bind(this),
          http: [{ path: "device-manager/models/asset/:_id", verb: "delete" }],
        },
        deleteDevice: {
          handler: this.deleteDevice.bind(this),
          http: [{ path: "device-manager/models/device/:_id", verb: "delete" }],
        },
        deleteMeasure: {
          handler: this.deleteMeasure.bind(this),
          http: [
            { path: "device-manager/models/measure/:_id", verb: "delete" },
          ],
        },
        listAssets: {
          handler: this.listAssets.bind(this),
          http: [{ path: "device-manager/models/assets", verb: "get" }],
        },
        listDevices: {
          handler: this.listDevices.bind(this),
          http: [{ path: "device-manager/models/devices", verb: "get" }],
        },
        listMeasures: {
          handler: this.listMeasures.bind(this),
          http: [{ path: "device-manager/models/measures", verb: "get" }],
        },
        writeAsset: {
          handler: this.writeAsset.bind(this),
          http: [{ path: "device-manager/models/assets", verb: "post" }],
        },
        writeDevice: {
          handler: this.writeDevice.bind(this),
          http: [{ path: "device-manager/models/devices", verb: "post" }],
        },
        writeMeasure: {
          handler: this.writeMeasure.bind(this),
          http: [{ path: "device-manager/models/measures", verb: "post" }],
        },
      },
    };
  }

  async writeAsset(request: KuzzleRequest): Promise<ApiModelCreateAssetResult> {
    const engineGroup = request.getBodyString("engineGroup");
    const model = request.getBodyString("model");
    const metadataMappings = request.getBodyObject("metadataMappings");
    const defaultValues = request.getBodyObject("defaultValues", {});
    const measures = request.getBodyObject("measures", {});

    const assetModel = await this.modelService.writeAsset(
      engineGroup,
      model,
      metadataMappings,
      defaultValues,
      measures
    );

    return assetModel;
  }

  async writeDevice(
    request: KuzzleRequest
  ): Promise<ApiModelCreateDeviceResult> {
    const model = request.getBodyString("model");
    const metadataMappings = request.getBodyObject("metadataMappings");
    const defaultValues = request.getBodyObject("defaultValues", {});
    const measures = request.getBodyObject("measures", {});

    const deviceModel = await this.modelService.writeDevice(
      model,
      metadataMappings,
      defaultValues,
      measures
    );

    return deviceModel;
  }

  async writeMeasure(
    request: KuzzleRequest
  ): Promise<ApiModelCreateMeasureResult> {
    const type = request.getBodyString("type");
    const valuesMappings = request.getBodyObject("valuesMappings");

    const measureModel = await this.modelService.writeMeasure(
      type,
      valuesMappings
    );

    return measureModel;
  }

  async deleteAsset(
    request: KuzzleRequest
  ): Promise<ApiModelDeleteAssetResult> {
    const _id = request.getId();

    await this.modelService.deleteAsset(_id);
  }

  async deleteDevice(
    request: KuzzleRequest
  ): Promise<ApiModelDeleteDeviceResult> {
    const _id = request.getId();

    await this.modelService.deleteDevice(_id);
  }

  async deleteMeasure(
    request: KuzzleRequest
  ): Promise<ApiModelDeleteMeasureResult> {
    const _id = request.getId();

    await this.modelService.deleteMeasure(_id);
  }

  async listAssets(request: KuzzleRequest): Promise<ApiModelListAssetsResult> {
    const engineGroup = request.getString("engineGroup");

    const models = await this.modelService.listAsset(engineGroup);

    return {
      models,
      total: models.length,
    };
  }

  async listDevices(): Promise<ApiModelListDevicesResult> {
    const models = await this.modelService.listDevices();

    return {
      models,
      total: models.length,
    };
  }

  async listMeasures(): Promise<ApiModelListMeasuresResult> {
    const models = await this.modelService.listMeasures();

    return {
      models,
      total: models.length,
    };
  }
}
